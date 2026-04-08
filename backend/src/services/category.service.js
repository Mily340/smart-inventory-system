import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

export const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createCategory = async ({ name }) => {
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) throw new ApiError(409, "Category name already exists");

  const last = await prisma.category.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(last.code.replace("C", ""), 10) : 0;
  const code = nextCode("C", lastNum);

  return prisma.category.create({
    data: { code, name },
  });
};

export const updateCategory = async (id, { name }) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found");

  const duplicate = await prisma.category.findFirst({
    where: { name, NOT: { id } },
  });
  if (duplicate) throw new ApiError(409, "Category name already exists");

  return prisma.category.update({
    where: { id },
    data: { name },
  });
};

export const deleteCategory = async (id) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!existing) throw new ApiError(404, "Category not found");
  if (existing.products.length > 0) {
    throw new ApiError(400, "Cannot delete category with existing products");
  }

  await prisma.category.delete({ where: { id } });
  return null;
};