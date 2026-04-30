// backend/src/services/distributor.service.js
import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

export const getAllDistributors = async () => {
  return prisma.distributor.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createDistributor = async ({ name, email, phone, address }) => {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").trim();
  const cleanAddress = String(address || "").trim();

  if (!cleanName) {
    throw new ApiError(400, "name is required");
  }

  if (!cleanEmail) {
    throw new ApiError(400, "email is required");
  }

  const exists = await prisma.distributor.findUnique({
    where: {
      email: cleanEmail,
    },
  });

  if (exists) {
    throw new ApiError(409, "Distributor email already exists");
  }

  const last = await prisma.distributor.findFirst({
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

  const lastNum = last?.code ? parseInt(String(last.code).replace("D", ""), 10) : 0;
  const code = nextCode("D", Number.isNaN(lastNum) ? 0 : lastNum);

  return prisma.distributor.create({
    data: {
      code,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      address: cleanAddress || null,
    },
  });
};

export const updateDistributor = async (id, { name, email, phone, address }) => {
  const distributor = await prisma.distributor.findUnique({
    where: {
      id,
    },
  });

  if (!distributor) {
    throw new ApiError(404, "Distributor not found");
  }

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").trim();
  const cleanAddress = String(address || "").trim();

  if (!cleanName) {
    throw new ApiError(400, "name is required");
  }

  if (!cleanEmail) {
    throw new ApiError(400, "email is required");
  }

  const duplicateEmail = await prisma.distributor.findUnique({
    where: {
      email: cleanEmail,
    },
  });

  if (duplicateEmail && duplicateEmail.id !== id) {
    throw new ApiError(409, "Distributor email already exists");
  }

  return prisma.distributor.update({
    where: {
      id,
    },
    data: {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      address: cleanAddress || null,
    },
  });
};

export const deleteDistributor = async (id) => {
  const distributor = await prisma.distributor.findUnique({
    where: {
      id,
    },
  });

  if (!distributor) {
    throw new ApiError(404, "Distributor not found");
  }

  const orderCount = await prisma.order.count({
    where: {
      distributorId: id,
    },
  });

  if (orderCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete this distributor because it is already used in orders"
    );
  }

  await prisma.distributor.delete({
    where: {
      id,
    },
  });

  return null;
};