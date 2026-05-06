import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const BRANCH_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }

  const branchIsActive =
    user.branchId && user.branch ? Boolean(user.branch.isActive) : true;

  const token = signToken({
    userId: user.id,
    role: user.role,
    branchId: user.branchId,
    branchIsActive,
  });

  return {
    token,
    user: {
      id: user.id,
      code: user.code || null,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      branchIsActive,
      branch: user.branch
        ? {
            id: user.branch.id,
            code: user.branch.code,
            name: user.branch.name,
            isActive: user.branch.isActive,
          }
        : null,
    },
  };
};

export const registerUser = async ({ fullName, email, password, role, branchId }) => {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    throw new ApiError(409, "Email already exists");
  }

  if (role === "SUPER_ADMIN") {
    throw new ApiError(400, "SUPER_ADMIN cannot be created from this route");
  }

  if (!branchId) {
    throw new ApiError(400, "branchId is required for all non-super-admin users");
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  if (!branch) {
    throw new ApiError(404, "Selected branch not found");
  }

  if (BRANCH_ROLES.includes(role) && !branch.isActive) {
    throw new ApiError(
      400,
      "Cannot assign Branch Manager or Branch Staff to an inactive branch"
    );
  }

  const last = await prisma.user.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(last.code.replace("U", ""), 10) : 0;
  const code = nextCode("U", Number.isFinite(lastNum) ? lastNum : 0);

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      code,
      fullName,
      email,
      password: hash,
      role,
      branchId,
    },
    select: {
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
          isActive: true,
        },
      },
    },
  });

  return {
    ...user,
    branchIsActive: user.branch ? Boolean(user.branch.isActive) : true,
  };
};