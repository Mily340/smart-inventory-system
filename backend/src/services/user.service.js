import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

export const listUsers = async ({ role, branchId }) => {
  const where = {};
  if (role) where.role = role;
  if (branchId) where.branchId = branchId;

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      code: true,
      fullName: true,
      email: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateUser = async (id, payload) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");

  const { id: _ignoreId, code: _ignoreCode, password: _ignorePassword, email: _ignoreEmail, ...data } = payload;

  // if role is changed to non-admin, branchId should exist
  if (data.role && data.role !== "SUPER_ADMIN") {
    if (!("branchId" in data) && !user.branchId) {
      throw new ApiError(400, "branchId is required for non-admin users");
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      code: true,
      fullName: true,
      email: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: { select: { id: true, code: true, name: true } },
    },
  });
};

export const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");

  // safety: prevent deleting SUPER_ADMIN (optional)
  if (user.role === "SUPER_ADMIN") throw new ApiError(400, "Cannot delete SUPER_ADMIN");

  await prisma.user.delete({ where: { id } });
  return null;
};