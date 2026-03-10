import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

export const getAllBranches = async () => {
  return prisma.branch.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createBranch = async ({ name, address, latitude, longitude }) => {
  // Find latest branch code (e.g., B001) and generate the next one (B002...)
  const last = await prisma.branch.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(last.code.replace("B", ""), 10) : 0;
  const code = nextCode("B", lastNum);

  return prisma.branch.create({
    data: { code, name, address, latitude, longitude },
  });
};

export const updateBranch = async (id, payload) => {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Branch not found");

  // Prevent changing primary id accidentally
  const { id: _ignoreId, ...safePayload } = payload;

  return prisma.branch.update({
    where: { id },
    data: safePayload,
  });
};

export const deleteBranch = async (id) => {
  const existing = await prisma.branch.findUnique({
    where: { id },
    include: { users: true, inventoryItems: true },
  });

  if (!existing) throw new ApiError(404, "Branch not found");

  if (existing.users.length > 0 || existing.inventoryItems.length > 0) {
    throw new ApiError(400, "Cannot delete branch with related users or inventory");
  }

  await prisma.branch.delete({ where: { id } });
  return null;
};