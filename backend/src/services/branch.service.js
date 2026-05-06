import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

export const getAllBranches = async () => {
  return prisma.branch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          inventoryItems: true,
          orders: true,
        },
      },
    },
  });
};

export const createBranch = async ({ name, address, latitude, longitude, isActive }) => {
  if (!name || !address) {
    throw new ApiError(400, "Branch name and address are required");
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "Valid latitude and longitude are required");
  }

  const last = await prisma.branch.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(last.code.replace("B", ""), 10) : 0;
  const code = nextCode("B", Number.isFinite(lastNum) ? lastNum : 0);

  return prisma.branch.create({
    data: {
      code,
      name,
      address,
      latitude: lat,
      longitude: lng,
      isActive: typeof isActive === "undefined" ? true : Boolean(toBoolean(isActive)),
    },
  });
};

export const updateBranch = async (id, payload) => {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Branch not found");

  const { id: _ignoreId, code: _ignoreCode, createdAt: _ignoreCreatedAt, updatedAt: _ignoreUpdatedAt, ...safePayload } =
    payload || {};

  const data = {};

  if (typeof safePayload.name !== "undefined") data.name = safePayload.name;
  if (typeof safePayload.address !== "undefined") data.address = safePayload.address;

  if (typeof safePayload.latitude !== "undefined") {
    const lat = Number(safePayload.latitude);
    if (!Number.isFinite(lat)) throw new ApiError(400, "Valid latitude is required");
    data.latitude = lat;
  }

  if (typeof safePayload.longitude !== "undefined") {
    const lng = Number(safePayload.longitude);
    if (!Number.isFinite(lng)) throw new ApiError(400, "Valid longitude is required");
    data.longitude = lng;
  }

  if (typeof safePayload.isActive !== "undefined") {
    data.isActive = Boolean(toBoolean(safePayload.isActive));
  }

  return prisma.branch.update({
    where: { id },
    data,
  });
};

export const activateBranch = async (id) => {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Branch not found");

  return prisma.branch.update({
    where: { id },
    data: { isActive: true },
  });
};

export const deactivateBranch = async (id) => {
  const existing = await prisma.branch.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          role: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!existing) throw new ApiError(404, "Branch not found");

  return prisma.branch.update({
    where: { id },
    data: { isActive: false },
  });
};

export const deleteBranch = async (id) => {
  const existing = await prisma.branch.findUnique({
    where: { id },
    include: { users: true, inventoryItems: true },
  });

  if (!existing) throw new ApiError(404, "Branch not found");

  if (existing.users.length > 0 || existing.inventoryItems.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete branch with related users or inventory. Deactivate the branch instead."
    );
  }

  await prisma.branch.delete({ where: { id } });
  return null;
};