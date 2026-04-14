import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

export const createRegistrationRequest = async ({
  fullName,
  email,
  password,
  role,
  branchId,
}) => {
  if (!fullName || !email || !password || !role) {
    throw new ApiError(400, "fullName, email, password, role are required");
  }

  // Do not allow request for SUPER_ADMIN
  if (role === "SUPER_ADMIN") {
    throw new ApiError(400, "SUPER_ADMIN registration request is not allowed");
  }

  if (role !== "SUPER_ADMIN" && !branchId) {
    throw new ApiError(400, "branchId is required for this role");
  }

  // if a real user already exists with this email, block
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) throw new ApiError(409, "Email already exists as a user");

  // if a pending request exists, block
  const reqExists = await prisma.registrationRequest.findUnique({
    where: { email },
  });
  if (reqExists) throw new ApiError(409, "Registration request already exists for this email");

  // validate branch
  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new ApiError(400, "Invalid branchId");
  }

  const hash = await bcrypt.hash(password, 10);

  return prisma.registrationRequest.create({
    data: {
      fullName,
      email,
      password: hash,
      role,
      branchId: branchId || null,
      status: "PENDING",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      branchId: true,
      status: true,
      createdAt: true,
    },
  });
};

export const listRegistrationRequests = async ({ status }) => {
  const where = {};
  if (status) where.status = status;

  return prisma.registrationRequest.findMany({
    where,
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });
};

export const approveRegistrationRequest = async (id, adminUser) => {
  return prisma.$transaction(async (tx) => {
    const req = await tx.registrationRequest.findUnique({ where: { id } });
    if (!req) throw new ApiError(404, "Registration request not found");
    if (req.status !== "PENDING") throw new ApiError(400, "Only PENDING requests can be approved");

    // create user
    const user = await tx.user.create({
      data: {
        fullName: req.fullName,
        email: req.email,
        password: req.password,
        role: req.role,
        branchId: req.branchId,
      },
      select: {
        id: true,
        code: true,
        fullName: true,
        email: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });

    // mark request approved
    await tx.registrationRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      },
    });

    // notify admins/branch (optional)
    await tx.notification.create({
      data: {
        type: "GENERAL",
        title: "Registration approved",
        message: `User ${user.fullName} (${user.email}) approved as ${user.role}`,
        branchId: user.branchId || null,
      },
    });

    return user;
  });
};

export const rejectRegistrationRequest = async (id, adminUser, reason) => {
  const req = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!req) throw new ApiError(404, "Registration request not found");
  if (req.status !== "PENDING") throw new ApiError(400, "Only PENDING requests can be rejected");

  await prisma.registrationRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
  });

  // optional notification
  await prisma.notification.create({
    data: {
      type: "GENERAL",
      title: "Registration rejected",
      message: `Registration rejected for ${req.email}${reason ? `: ${reason}` : ""}`,
      branchId: req.branchId || null,
    },
  });

  return null;
};