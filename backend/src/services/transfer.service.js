// backend/src/services/transfer.service.js
import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const BRANCH_SCOPED_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];
const TRANSFER_ADMIN_ROLES = ["SUPER_ADMIN", "INVENTORY_OFFICER"];

const INACTIVE_BRANCH_TRANSFER_MESSAGE =
  "Source or receiving branch is inactive. Please activate the branch before creating or processing a transfer.";

const ensurePositiveInt = (value, fieldName) => {
  const n = Number(value);

  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }

  return n;
};

const ensureActiveTransferBranches = (fromBranch, toBranch) => {
  if (!fromBranch) {
    throw new ApiError(400, "Invalid fromBranchId");
  }

  if (!toBranch) {
    throw new ApiError(400, "Invalid toBranchId");
  }

  if (fromBranch.isActive === false || toBranch.isActive === false) {
    throw new ApiError(403, INACTIVE_BRANCH_TRANSFER_MESSAGE);
  }
};

const notifyTransfer = async (tx, transfer, title, message) => {
  await tx.notification.create({
    data: {
      type: "TRANSFER_STATUS",
      title,
      message,
      branchId: transfer.toBranchId,
    },
  });

  await tx.notification.create({
    data: {
      type: "TRANSFER_STATUS",
      title,
      message,
      branchId: transfer.fromBranchId,
    },
  });
};

const isBranchScopedUser = (user) => BRANCH_SCOPED_ROLES.includes(user?.role);

const isTransferAdmin = (user) => TRANSFER_ADMIN_ROLES.includes(user?.role);

const ensureAssignedBranch = (user) => {
  if (!user?.branchId) {
    throw new ApiError(403, "No branch assigned to this user");
  }
};

const ensureTransferRelatedToUserBranch = (user, transfer) => {
  if (!isBranchScopedUser(user)) return;

  ensureAssignedBranch(user);

  const related =
    transfer.fromBranchId === user.branchId || transfer.toBranchId === user.branchId;

  if (!related) {
    throw new ApiError(403, "You can only access transfers related to your assigned branch");
  }
};

const ensureTransferAdmin = (user) => {
  if (!isTransferAdmin(user)) {
    throw new ApiError(403, "Only admin staff can approve, reject, or dispatch transfers");
  }
};

export const listTransfers = async ({ branchId }) => {
  const where = branchId
    ? {
        OR: [{ fromBranchId: branchId }, { toBranchId: branchId }],
      }
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

export const createTransferRequest = async ({ fromBranchId, toBranchId, items }, user) => {
  if (user?.role === "BRANCH_STAFF") {
    throw new ApiError(403, "BRANCH_STAFF cannot create transfer requests");
  }

  if (user?.role === "BRANCH_MANAGER") {
    ensureAssignedBranch(user);

    if (toBranchId !== user.branchId) {
      throw new ApiError(403, "Branch Manager can request stock only for the assigned branch");
    }
  }

  if (!fromBranchId || !toBranchId) {
    throw new ApiError(400, "fromBranchId and toBranchId are required");
  }

  if (fromBranchId === toBranchId) {
    throw new ApiError(400, "fromBranchId and toBranchId cannot be the same");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "items is required");
  }

  const fromBranch = await prisma.branch.findUnique({
    where: { id: fromBranchId },
  });

  const toBranch = await prisma.branch.findUnique({
    where: { id: toBranchId },
  });

  ensureActiveTransferBranches(fromBranch, toBranch);

  const normalizedItems = [];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];

    if (!it.productId) {
      throw new ApiError(400, `items[${idx}].productId is required`);
    }

    const product = await prisma.product.findUnique({
      where: { id: it.productId },
    });

    if (!product) {
      throw new ApiError(400, `Invalid productId in items[${idx}]`);
    }

    const qty = ensurePositiveInt(it.quantity, `items[${idx}].quantity`);

    normalizedItems.push({
      productId: it.productId,
      quantity: qty,
    });
  }

  return prisma.transferRequest.create({
    data: {
      fromBranchId,
      toBranchId,
      requestedBy: user.id,
      status: "PENDING",
      items: {
        create: normalizedItems,
      },
    },
    include: {
      fromBranch: true,
      toBranch: true,
      requester: true,
      items: { include: { product: true } },
    },
  });
};

export const approveTransfer = async (id, user) => {
  ensureTransferAdmin(user);

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: {
        items: true,
        fromBranch: true,
        toBranch: true,
      },
    });

    if (!transfer) {
      throw new ApiError(404, "Transfer request not found");
    }

    if (transfer.status !== "PENDING") {
      throw new ApiError(400, "Only PENDING requests can be approved");
    }

    ensureActiveTransferBranches(transfer.fromBranch, transfer.toBranch);

    const updated = await tx.transferRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: user.id,
      },
      include: {
        items: { include: { product: true } },
        fromBranch: true,
        toBranch: true,
      },
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
  ensureTransferAdmin(user);

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: {
        fromBranch: true,
        toBranch: true,
      },
    });

    if (!transfer) {
      throw new ApiError(404, "Transfer request not found");
    }

    if (transfer.status !== "PENDING") {
      throw new ApiError(400, "Only PENDING requests can be rejected");
    }

    const updated = await tx.transferRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedBy: user.id,
      },
      include: {
        items: { include: { product: true } },
        fromBranch: true,
        toBranch: true,
      },
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
  ensureTransferAdmin(user);

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({
      where: { id },
      include: {
        items: true,
        fromBranch: true,
        toBranch: true,
      },
    });

    if (!transfer) {
      throw new ApiError(404, "Transfer request not found");
    }

    if (transfer.status !== "APPROVED") {
      throw new ApiError(400, "Only APPROVED requests can be dispatched");
    }

    ensureActiveTransferBranches(transfer.fromBranch, transfer.toBranch);

    for (const item of transfer.items) {
      const inv = await tx.inventory.findUnique({
        where: {
          branchId_productId: {
            branchId: transfer.fromBranchId,
            productId: item.productId,
          },
        },
      });

      if (!inv || inv.quantity < item.quantity) {
        throw new ApiError(400, "Insufficient stock to dispatch transfer");
      }
    }

    for (const item of transfer.items) {
      await tx.inventory.update({
        where: {
          branchId_productId: {
            branchId: transfer.fromBranchId,
            productId: item.productId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
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
      data: {
        status: "DISPATCHED",
        dispatchDate: new Date(),
      },
      include: {
        items: { include: { product: true } },
        fromBranch: true,
        toBranch: true,
      },
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
      include: {
        items: true,
        fromBranch: true,
        toBranch: true,
      },
    });

    if (!transfer) {
      throw new ApiError(404, "Transfer request not found");
    }

    ensureTransferRelatedToUserBranch(user, transfer);

    if (user?.role === "BRANCH_MANAGER" && transfer.toBranchId !== user.branchId) {
      throw new ApiError(403, "Branch Manager can receive transfers only for the assigned branch");
    }

    if (user?.role === "BRANCH_STAFF") {
      throw new ApiError(403, "BRANCH_STAFF cannot receive transfers");
    }

    if (transfer.status !== "DISPATCHED") {
      throw new ApiError(400, "Only DISPATCHED transfers can be received");
    }

    ensureActiveTransferBranches(transfer.fromBranch, transfer.toBranch);

    for (const item of transfer.items) {
      await tx.inventory.upsert({
        where: {
          branchId_productId: {
            branchId: transfer.toBranchId,
            productId: item.productId,
          },
        },
        update: {
          quantity: {
            increment: item.quantity,
          },
        },
        create: {
          branchId: transfer.toBranchId,
          productId: item.productId,
          quantity: item.quantity,
          reorderLevel: 0,
        },
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
      data: {
        status: "RECEIVED",
        receiveDate: new Date(),
      },
      include: {
        items: { include: { product: true } },
        fromBranch: true,
        toBranch: true,
      },
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