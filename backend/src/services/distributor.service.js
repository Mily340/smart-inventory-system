import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

export const getAllDistributors = async () => {
  return prisma.distributor.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createDistributor = async ({ name, email, phone, address }) => {
  if (!name) throw new ApiError(400, "name is required");
  if (!email) throw new ApiError(400, "email is required");

  const exists = await prisma.distributor.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, "Distributor email already exists");

  const last = await prisma.distributor.findFirst({
    where: { code: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  const lastNum = last?.code ? parseInt(String(last.code).replace("D", ""), 10) : 0;
  const code = nextCode("D", lastNum);

  return prisma.distributor.create({
    data: {
      code,
      name,
      email,
      phone: phone || null,
      address: address || null,
    },
  });
};