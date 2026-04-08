import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

export const getAllProducts = async () => {
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
};

export const createProduct = async ({ sku, name, description, unit, categoryId }) => {
  const dupSku = await prisma.product.findUnique({ where: { sku } });
  if (dupSku) throw new ApiError(409, "SKU already exists");

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new ApiError(400, "Invalid categoryId");

  const last = await prisma.product.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(last.code.replace("P", ""), 10) : 0;
  const code = nextCode("P", lastNum);

  return prisma.product.create({
    data: { code, sku, name, description: description || null, unit, categoryId },
    include: { category: true },
  });
};

export const updateProduct = async (id, payload) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found");

  const { id: _ignoreId, code: _ignoreCode, ...data } = payload; // do not allow changing id/code

  if (data.sku && data.sku !== existing.sku) {
    const dupSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (dupSku) throw new ApiError(409, "SKU already exists");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new ApiError(400, "Invalid categoryId");
  }

  return prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
};

export const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      inventoryItems: true,
      stockTransactions: true,
      transferItems: true,
      orderItems: true,
    },
  });

  if (!existing) throw new ApiError(404, "Product not found");

  const hasRelations =
    existing.inventoryItems.length > 0 ||
    existing.stockTransactions.length > 0 ||
    existing.transferItems.length > 0 ||
    existing.orderItems.length > 0;

  if (hasRelations) throw new ApiError(400, "Cannot delete product with related records");

  await prisma.product.delete({ where: { id } });
  return null;
};