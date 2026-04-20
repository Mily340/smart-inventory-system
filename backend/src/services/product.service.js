import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const ensurePositiveNumber = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive number`);
  }
  return n;
};

const normalizeOptionalUrl = (value) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;

  // basic URL validation (keeps it simple)
  try {
    const u = new URL(s);
    if (!["http:", "https:"].includes(u.protocol)) {
      throw new Error("Only http/https allowed");
    }
  } catch {
    throw new ApiError(400, "imageUrl must be a valid http/https URL");
  }

  return s;
};

export const getAllProducts = async () => {
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
};

export const createProduct = async ({
  sku,
  name,
  description,
  unit,
  price,
  imageUrl,
  categoryId,
}) => {
  if (!sku) throw new ApiError(400, "sku is required");
  if (!name) throw new ApiError(400, "name is required");
  if (!unit) throw new ApiError(400, "unit is required");
  if (!categoryId) throw new ApiError(400, "categoryId is required");

  const p = ensurePositiveNumber(price, "price");
  const img = normalizeOptionalUrl(imageUrl);

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
    data: {
      code,
      sku,
      name,
      description: description || null,
      unit,
      price: p,
      imageUrl: img,
      categoryId,
    },
    include: { category: true },
  });
};

export const updateProduct = async (id, payload) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found");

  const { id: _ignoreId, code: _ignoreCode, ...data } = payload;

  if (data.sku && data.sku !== existing.sku) {
    const dupSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (dupSku) throw new ApiError(409, "SKU already exists");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new ApiError(400, "Invalid categoryId");
  }

  if (data.price !== undefined) {
    data.price = ensurePositiveNumber(data.price, "price");
  }

  if (data.imageUrl !== undefined) {
    data.imageUrl = normalizeOptionalUrl(data.imageUrl);
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