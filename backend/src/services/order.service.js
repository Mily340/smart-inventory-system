import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const ensurePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0)
    throw new ApiError(400, `${fieldName} must be a positive integer`);
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
      branchId: order.branchId,
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
  if (!Array.isArray(items) || items.length === 0)
    throw new ApiError(400, "items is required");

  return prisma.$transaction(async (tx) => {
    const distributor = await tx.distributor.findUnique({
      where: { id: distributorId },
    });
    if (!distributor) throw new ApiError(400, "Invalid distributorId");

    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(400, "Invalid branchId");

    // Build items using REAL product price and check stock
    const normalizedItems = [];
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      if (!it?.productId)
        throw new ApiError(400, `items[${idx}].productId is required`);

      const quantity = ensurePositiveInt(it.quantity, `items[${idx}].quantity`);

      const product = await tx.product.findUnique({
        where: { id: it.productId },
      });
      if (!product)
        throw new ApiError(400, `Invalid productId in items[${idx}]`);

      const unitPrice = Number(product.price || 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new ApiError(
          400,
          `Product price is missing/invalid for ${product.name}`
        );
      }

      // Stock validation at CREATE time
      const inv = await tx.inventory.findUnique({
        where: { branchId_productId: { branchId, productId: it.productId } },
      });

      if (!inv)
        throw new ApiError(
          400,
          `No stock record for ${product.name} in this branch`
        );
      if (inv.quantity < quantity)
        throw new ApiError(400, `Insufficient stock for ${product.name}`);

      const subtotal = Number((quantity * unitPrice).toFixed(2));
      normalizedItems.push({
        productId: it.productId,
        quantity,
        unitPrice,
        subtotal,
      });
    }

    const totalAmount = Number(
      normalizedItems.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2)
    );

    // Code generation: O001, O002...
    const last = await tx.order.findFirst({
      where: { code: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    const lastNum = last?.code
      ? parseInt(String(last.code).replace("O", ""), 10)
      : 0;
    const code = nextCode("O", Number.isNaN(lastNum) ? 0 : lastNum);

    const created = await tx.order.create({
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

    await notifyOrder(
      tx,
      created,
      "Order created",
      `Order ${created.code || created.id} created (PENDING)`
    );

    return created;
  });
};

const allowedTransitions = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["PACKED", "CANCELLED"],
  PACKED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
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

    // ✅ BRANCH_STAFF restriction:
    // Only allow CANCELLED, and only when current status is PENDING
    if (user?.role === "BRANCH_STAFF") {
      if (status !== "CANCELLED") {
        throw new ApiError(403, "BRANCH_STAFF can only cancel orders");
      }
      if (order.status !== "PENDING") {
        throw new ApiError(400, "Only PENDING orders can be cancelled");
      }
    }

    const current = order.status;
    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition: ${current} -> ${status}`);
    }

    // Deduct inventory when APPROVED (confirm stock again)
    if (status === "APPROVED") {
      for (const item of order.items) {
        const inv = await tx.inventory.findUnique({
          where: {
            branchId_productId: {
              branchId: order.branchId,
              productId: item.productId,
            },
          },
        });
        if (!inv || inv.quantity < item.quantity) {
          throw new ApiError(400, "Insufficient stock to approve this order");
        }
      }

      for (const item of order.items) {
        await tx.inventory.update({
          where: {
            branchId_productId: {
              branchId: order.branchId,
              productId: item.productId,
            },
          },
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