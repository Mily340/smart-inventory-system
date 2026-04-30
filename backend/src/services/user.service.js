// backend/src/services/user.service.js
import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const userSelect = {
  id: true,
  code: true,
  fullName: true,
  email: true,
  role: true,
  branchId: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
};

const checkBranchManagerLimit = async ({ branchId, excludeUserId }) => {
  if (!branchId) {
    throw new ApiError(400, "branchId is required for branch manager");
  }

  const existingManager = await prisma.user.findFirst({
    where: {
      role: "BRANCH_MANAGER",
      branchId,
      ...(excludeUserId
        ? {
            id: {
              not: excludeUserId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  if (existingManager) {
    throw new ApiError(400, "This branch already has a branch manager");
  }
};

export const listUsers = async ({ role, branchId }) => {
  const where = {};

  if (role) where.role = role;
  if (branchId) where.branchId = branchId;

  return prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const listRiders = async () => {
  return prisma.user.findMany({
    where: {
      role: "DELIVERY_RIDER",
    },
    select: {
      id: true,
      code: true,
      fullName: true,
      email: true,
      role: true,
      branchId: true,
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });
};

export const createUser = async ({ fullName, email, password, role, branchId }) => {
  const cleanFullName = String(fullName || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanFullName || !cleanEmail || !password || !role) {
    throw new ApiError(400, "fullName, email, password, role are required");
  }

  if (role === "SUPER_ADMIN") {
    throw new ApiError(400, "SUPER_ADMIN cannot be created");
  }

  if (!branchId) {
    throw new ApiError(400, "branchId is required for this role");
  }

  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
  });

  if (!branch) {
    throw new ApiError(400, "Invalid branchId");
  }

  const dup = await prisma.user.findUnique({
    where: {
      email: cleanEmail,
    },
  });

  if (dup) {
    throw new ApiError(409, "Email already exists");
  }

  if (role === "BRANCH_MANAGER") {
    await checkBranchManagerLimit({ branchId });
  }

  const last = await prisma.user.findFirst({
    where: {
      code: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      code: true,
    },
  });

  const lastNum = last?.code ? parseInt(String(last.code).replace("U", ""), 10) : 0;
  const code = nextCode("U", Number.isNaN(lastNum) ? 0 : lastNum);

  const hash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      code,
      fullName: cleanFullName,
      email: cleanEmail,
      password: hash,
      role,
      branchId,
    },
    select: userSelect,
  });
};

export const updateUser = async (id, payload) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(400, "Cannot update SUPER_ADMIN");
  }

  const {
    id: _ignoreId,
    code: _ignoreCode,
    password: _ignorePassword,
    email: _ignoreEmail,
    createdAt: _ignoreCreatedAt,
    updatedAt: _ignoreUpdatedAt,
    branch: _ignoreBranch,
    ...data
  } = payload;

  if (data.role === "SUPER_ADMIN") {
    throw new ApiError(400, "SUPER_ADMIN cannot be assigned");
  }

  if ("fullName" in data) {
    data.fullName = String(data.fullName || "").trim();

    if (!data.fullName) {
      throw new ApiError(400, "fullName is required");
    }
  }

  if (data.role && data.role !== "SUPER_ADMIN") {
    if (!("branchId" in data) && !user.branchId) {
      throw new ApiError(400, "branchId is required for non-admin users");
    }
  }

  if (data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: {
        id: data.branchId,
      },
    });

    if (!branch) {
      throw new ApiError(400, "Invalid branchId");
    }
  }

  const targetRole = data.role || user.role;
  const targetBranchId = "branchId" in data ? data.branchId : user.branchId;

  if (targetRole === "BRANCH_MANAGER") {
    await checkBranchManagerLimit({
      branchId: targetBranchId,
      excludeUserId: id,
    });
  }

  return prisma.user.update({
    where: {
      id,
    },
    data,
    select: userSelect,
  });
};

export const resetUserPassword = async (id, { newPassword }, adminUser) => {
  if (!newPassword) {
    throw new ApiError(400, "newPassword is required");
  }

  if (String(newPassword).length < 6) {
    throw new ApiError(400, "newPassword must be at least 6 characters");
  }

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(400, "Cannot reset SUPER_ADMIN password");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      password: hash,
    },
  });

  await prisma.notification.create({
    data: {
      type: "GENERAL",
      title: "Password reset",
      message: `Password was reset by ${adminUser?.id ? "admin" : "system"} for ${user.email}`,
      branchId: user.branchId || null,
    },
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
};

export const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(400, "Cannot delete SUPER_ADMIN");
  }

  await prisma.user.delete({
    where: {
      id,
    },
  });

  return null;
};