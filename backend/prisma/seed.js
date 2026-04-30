// backend/prisma/seed.js
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123@";

  const hash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        code: existingAdmin.code || "U001",
        fullName: "Super Admin",
        password: hash,
        role: "SUPER_ADMIN",
        branchId: null,
      },
    });

    console.log("Super Admin already existed. Password and details updated.");
    return;
  }

  await prisma.user.create({
    data: {
      code: "U001",
      fullName: "Super Admin",
      email: adminEmail,
      password: hash,
      role: "SUPER_ADMIN",
      branchId: null,
    },
  });

  console.log("Super Admin created successfully.");
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });