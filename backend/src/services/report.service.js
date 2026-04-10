import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const parseDate = (value, field) => {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${field} must be a valid date (YYYY-MM-DD)`);
  return d;
};

export const lowStockReport = async ({ branchId }) => {
  const where = branchId ? { branchId } : {};

  // only show items where reorderLevel > 0 and quantity <= reorderLevel
  return prisma.inventory.findMany({
    where: {
      ...where,
      reorderLevel: { gt: 0 },
      quantity: { lte: prisma.inventory.fields.reorderLevel }, // prisma will translate
    },
    include: {
      branch: true,
      product: { include: { category: true } },
    },
    orderBy: [{ branchId: "asc" }, { quantity: "asc" }],
  });
};

export const stockTransactionsReport = async ({ branchId, productId, from, to }) => {
  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");

  const where = {};
  if (branchId) where.branchId = branchId;
  if (productId) where.productId = productId;

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) {
      // include full day
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return prisma.stockTransaction.findMany({
    where,
    include: {
      branch: true,
      product: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const ordersReport = async ({ branchId, status, from, to }) => {
  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");

  const where = {};
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

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

export const transfersReport = async ({ branchId, status, from, to }) => {
  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");

  const where = {};
  if (status) where.status = status;

  if (branchId) {
    where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

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