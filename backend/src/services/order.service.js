import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const ensurePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `${fieldName} must be a positive integer`);
  return n;
};

const ensurePositiveNumber = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new ApiError(400, `${fieldName} must be a positive number`);
  return n;
};

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const notifyOrder = async (tx, order, title, message) => {
  await tx.notification.create({
    data: {
      type: "ORDER_STATUS",
      title,
      message,
      branchId: order.branchId, // notify that branch
    },
  });
};

export const listOrders = async ({ branchId }) => {
  const where = branchId ? { branchId } : {};

  return prisma.order.findMany({
    where,
    include: {
      distributor: true,
      branch: true,
      creator: true,
      items: { include: { product: true } },
      delivery: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createOrder = async ({ distributorId, branchId, items }, user) => {
  if (!distributorId) throw new ApiError(400, "distributorId is required");
  if (!branchId) throw new ApiError(400, "branchId is required");
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "items is required");

  const distributor = await prisma.distributor.findUnique({ where: { id: distributorId } });
  if (!distributor) throw new ApiError(400, "Invalid distributorId");

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new ApiError(400, "Invalid branchId");

  // items: [{productId, quantity, unitPrice}]
  const normalizedItems = items.map((it, idx) => {
    if (!it.productId) throw new ApiError(400, `items[${idx}].productId is required`);
    const quantity = ensurePositiveInt(it.quantity, `items[${idx}].quantity`);
    const unitPrice = ensurePositiveNumber(it.unitPrice, `items[${idx}].unitPrice`);
    const subtotal = Number((quantity * unitPrice).toFixed(2));
    return { productId: it.productId, quantity, unitPrice, subtotal };
  });

  // validate products exist
  for (const it of normalizedItems) {
    const p = await prisma.product.findUnique({ where: { id: it.productId } });
    if (!p) throw new ApiError(400, "Invalid productId in items");
  }

  const totalAmount = Number(
    normalizedItems.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2)
  );

  // code generation (assumes your Order model has `code` field already)
  const last = await prisma.order.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  const lastNum = last?.code ? parseInt(String(last.code).replace("O", ""), 10) : 0;
  const code = nextCode("O", lastNum);

  return prisma.order.create({
    data: {
      code,
      distributorId,
      branchId,
      createdBy: user.id,
      status: "PENDING",
      paymentStatus: "UNPAID",
      totalAmount,
      items: { create: normalizedItems },
    },
    include: {
      distributor: true,
      branch: true,
      creator: true,
      items: { include: { product: true } },
    },
  });
};

const allowedTransitions = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["PACKED", "CANCELLED"],
  PACKED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "FAILED", "CANCELLED"], // if you keep FAILED in DeliveryStatus only, remove FAILED here
  DELIVERED: [],
  CANCELLED: [],
};

export const updateOrderStatus = async (id, { status }, user) => {
  if (!status) throw new ApiError(400, "status is required");

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true, branch: true, distributor: true },
    });

    if (!order) throw new ApiError(404, "Order not found");

    const current = order.status;
    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition: ${current} -> ${status}`);
    }

    // Deduct inventory when APPROVED (one clear rule)
    if (status === "APPROVED") {
      // check stock
      for (const item of order.items) {
        const inv = await tx.inventory.findUnique({
          where: { branchId_productId: { branchId: order.branchId, productId: item.productId } },
        });
        if (!inv || inv.quantity < item.quantity) {
          throw new ApiError(400, "Insufficient stock to approve this order");
        }
      }

      // deduct + record ORDER_OUT transactions
      for (const item of order.items) {
        await tx.inventory.update({
          where: { branchId_productId: { branchId: order.branchId, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.stockTransaction.create({
          data: {
            branchId: order.branchId,
            productId: item.productId,
            type: "ORDER_OUT",
            quantity: item.quantity,
            reason: "Order approved (stock deducted)",
            referenceType: "ORDER",
            referenceId: order.id,
            createdBy: user.id,
          },
        });
      }
    }

    const updated = await tx.order.update({
      where: { id },
      data: { status },
      include: {
        distributor: true,
        branch: true,
        creator: true,
        items: { include: { product: true } },
      },
    });

    await notifyOrder(
      tx,
      updated,
      "Order status updated",
      `Order ${updated.code || updated.id} status changed to ${updated.status}`
    );

    return updated;
  });
};