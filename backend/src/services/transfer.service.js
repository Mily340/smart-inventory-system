import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const ensurePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `${fieldName} must be a positive integer`);
  return n;
};

const notifyTransfer = async (tx, transfer, title, message) => {
  await tx.notification.create({
    data: {
      type: "TRANSFER_STATUS",
      title,
      message,
      branchId: transfer.toBranchId, // notify receiving branch
    },
  });

  await tx.notification.create({
    data: {
      type: "TRANSFER_STATUS",
      title,
      message,
      branchId: transfer.fromBranchId, // notify sending branch
    },
  });
};

export const listTransfers = async ({ branchId }) => {
  const where = branchId
    ? { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] }
    : {};

  return prisma.transferRequest.findMany({
    where,
    include: {
      fromBranch: true,
      toBranch: true,
      requester: true,
      approver: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createTransferRequest = async (
  { fromBranchId, toBranchId, items },
  user
) => {
  if (!fromBranchId || !toBranchId) throw new ApiError(400, "fromBranchId and toBranchId are required");
  if (fromBranchId === toBranchId) throw new ApiError(400, "fromBranchId and toBranchId cannot be the same");
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "items is required");

  // validate branches + items
  const fromBranch = await prisma.branch.findUnique({ where: { id: fromBranchId } });
  const toBranch = await prisma.branch.findUnique({ where: { id: toBranchId } });
  if (!fromBranch) throw new ApiError(400, "Invalid fromBranchId");
  if (!toBranch) throw new ApiError(400, "Invalid toBranchId");

  const normalizedItems = items.map((it, idx) => {
    if (!it.productId) throw new ApiError(400, `items[${idx}].productId is required`);
    const qty = ensurePositiveInt(it.quantity, `items[${idx}].quantity`);
    return { productId: it.productId, quantity: qty };
  });

  // create request + items
  return prisma.transferRequest.create({
    data: {
      fromBranchId,
      toBranchId,
      requestedBy: user.id,
      status: "PENDING",
      items: { create: normalizedItems },
    },
    include: {
      fromBranch: true,
      toBranch: true,
      items: { include: { product: true } },
    },
  });
};

export const approveTransfer = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: { items: true, fromBranch: true, toBranch: true },
    });
    if (!transfer) throw new ApiError(404, "Transfer request not found");
    if (transfer.status !== "PENDING") throw new ApiError(400, "Only PENDING requests can be approved");

    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: user.id },
      include: { items: { include: { product: true } }, fromBranch: true, toBranch: true },
    });

    await notifyTransfer(
      tx,
      updated,
      "Transfer approved",
      `Transfer approved from ${updated.fromBranch.name} to ${updated.toBranch.name}`
    );

    return updated;
  });
};

export const rejectTransfer = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: { fromBranch: true, toBranch: true },
    });
    if (!transfer) throw new ApiError(404, "Transfer request not found");
    if (transfer.status !== "PENDING") throw new ApiError(400, "Only PENDING requests can be rejected");

    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "REJECTED", approvedBy: user.id },
      include: { items: { include: { product: true } }, fromBranch: true, toBranch: true },
    });

    await notifyTransfer(
      tx,
      updated,
      "Transfer rejected",
      `Transfer rejected from ${updated.fromBranch.name} to ${updated.toBranch.name}`
    );

    return updated;
  });
};

export const dispatchTransfer = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: { items: true, fromBranch: true, toBranch: true },
    });
    if (!transfer) throw new ApiError(404, "Transfer request not found");
    if (transfer.status !== "APPROVED") throw new ApiError(400, "Only APPROVED requests can be dispatched");

    // check stock availability in fromBranch
    for (const item of transfer.items) {
      const inv = await tx.inventory.findUnique({
        where: { branchId_productId: { branchId: transfer.fromBranchId, productId: item.productId } },
      });
      if (!inv || inv.quantity < item.quantity) {
        throw new ApiError(400, "Insufficient stock to dispatch transfer");
      }
    }

    // deduct stock + record transactions
    for (const item of transfer.items) {
      await tx.inventory.update({
        where: { branchId_productId: { branchId: transfer.fromBranchId, productId: item.productId } },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          branchId: transfer.fromBranchId,
          productId: item.productId,
          type: "TRANSFER_OUT",
          quantity: item.quantity,
          reason: "Transfer dispatched",
          referenceType: "TRANSFER",
          referenceId: transfer.id,
          createdBy: user.id,
        },
      });
    }

    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "DISPATCHED", dispatchDate: new Date() },
      include: { items: { include: { product: true } }, fromBranch: true, toBranch: true },
    });

    await notifyTransfer(
      tx,
      updated,
      "Transfer dispatched",
      `Transfer dispatched from ${updated.fromBranch.name} to ${updated.toBranch.name}`
    );

    return updated;
  });
};

export const receiveTransfer = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: { items: true, fromBranch: true, toBranch: true },
    });
    if (!transfer) throw new ApiError(404, "Transfer request not found");
    if (transfer.status !== "DISPATCHED") throw new ApiError(400, "Only DISPATCHED transfers can be received");

    // add stock to toBranch + record transactions
    for (const item of transfer.items) {
      await tx.inventory.upsert({
        where: { branchId_productId: { branchId: transfer.toBranchId, productId: item.productId } },
        update: { quantity: { increment: item.quantity } },
        create: { branchId: transfer.toBranchId, productId: item.productId, quantity: item.quantity, reorderLevel: 0 },
      });

      await tx.stockTransaction.create({
        data: {
          branchId: transfer.toBranchId,
          productId: item.productId,
          type: "TRANSFER_IN",
          quantity: item.quantity,
          reason: "Transfer received",
          referenceType: "TRANSFER",
          referenceId: transfer.id,
          createdBy: user.id,
        },
      });
    }

    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "RECEIVED", receiveDate: new Date() },
      include: { items: { include: { product: true } }, fromBranch: true, toBranch: true },
    });

    await notifyTransfer(
      tx,
      updated,
      "Transfer received",
      `Transfer received at ${updated.toBranch.name} from ${updated.fromBranch.name}`
    );

    return updated;
  });
};