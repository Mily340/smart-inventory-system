import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

/**
 * Helpers
 */
const ensurePositiveInt = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }
  return n;
};

// Create a LOW_STOCK notification when qty <= reorderLevel
const createLowStockNotificationIfNeeded = async (tx, branchId, productId) => {
  const inv = await tx.inventory.findUnique({
    where: { branchId_productId: { branchId, productId } },
    include: { branch: true, product: true },
  });

  if (!inv) return;

  if (inv.quantity <= inv.reorderLevel) {
    await tx.notification.create({
      data: {
        type: "LOW_STOCK",
        title: "Low stock alert",
        message: `Low stock: ${inv.product.name} at ${inv.branch.name}. Qty=${inv.quantity}, ReorderLevel=${inv.reorderLevel}`,
        branchId,
      },
    });
  }
};

export const listInventory = async ({ branchId }) => {
  const where = branchId ? { branchId } : {};

  return prisma.inventory.findMany({
    where,
    include: {
      branch: true,
      product: { include: { category: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
};

export const stockIn = async ({ branchId, productId, quantity, reason }, userId) => {
  const qty = ensurePositiveInt(quantity, "quantity");

  return prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(400, "Invalid branchId");

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(400, "Invalid productId");

    const inv = await tx.inventory.upsert({
      where: { branchId_productId: { branchId, productId } },
      update: { quantity: { increment: qty } },
      create: { branchId, productId, quantity: qty, reorderLevel: 0 },
    });

    await tx.stockTransaction.create({
      data: {
        branchId,
        productId,
        type: "STOCK_IN",
        quantity: qty,
        reason: reason || "Stock in",
        referenceType: "MANUAL",
        referenceId: null,
        createdBy: userId,
      },
    });

    await createLowStockNotificationIfNeeded(tx, branchId, productId);

    return inv;
  });
};

export const stockOut = async ({ branchId, productId, quantity, reason }, userId) => {
  const qty = ensurePositiveInt(quantity, "quantity");

  return prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(400, "Invalid branchId");

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(400, "Invalid productId");

    const inv = await tx.inventory.findUnique({
      where: { branchId_productId: { branchId, productId } },
    });

    if (!inv) throw new ApiError(404, "Inventory record not found for this branch/product");
    if (inv.quantity < qty) throw new ApiError(400, "Insufficient stock");

    const updated = await tx.inventory.update({
      where: { id: inv.id },
      data: { quantity: { decrement: qty } },
    });

    await tx.stockTransaction.create({
      data: {
        branchId,
        productId,
        type: "STOCK_OUT",
        quantity: qty,
        reason: reason || "Stock out",
        referenceType: "MANUAL",
        referenceId: null,
        createdBy: userId,
      },
    });

    await createLowStockNotificationIfNeeded(tx, branchId, productId);

    return updated;
  });
};

export const adjustStock = async ({ branchId, productId, newQuantity, reason }, userId) => {
  const q = Number(newQuantity);
  if (!Number.isInteger(q) || q < 0) {
    throw new ApiError(400, "newQuantity must be an integer >= 0");
  }

  return prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(400, "Invalid branchId");

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new ApiError(400, "Invalid productId");

    const inv = await tx.inventory.upsert({
      where: { branchId_productId: { branchId, productId } },
      update: { quantity: q },
      create: { branchId, productId, quantity: q, reorderLevel: 0 },
    });

    await tx.stockTransaction.create({
      data: {
        branchId,
        productId,
        type: "ADJUSTMENT",
        quantity: q,
        reason: reason || "Adjustment",
        referenceType: "MANUAL",
        referenceId: null,
        createdBy: userId,
      },
    });

    await createLowStockNotificationIfNeeded(tx, branchId, productId);

    return inv;
  });
};

export const updateReorderLevel = async ({ branchId, productId, reorderLevel }) => {
  const lvl = Number(reorderLevel);
  if (!Number.isInteger(lvl) || lvl < 0) {
    throw new ApiError(400, "reorderLevel must be an integer >= 0");
  }

  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({
      where: { branchId_productId: { branchId, productId } },
    });

    if (!inv) throw new ApiError(404, "Inventory record not found for this branch/product");

    const updated = await tx.inventory.update({
      where: { id: inv.id },
      data: { reorderLevel: lvl },
    });

    await createLowStockNotificationIfNeeded(tx, branchId, productId);

    return updated;
  });
};