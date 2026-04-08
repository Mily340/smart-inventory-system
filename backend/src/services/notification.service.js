import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

export const listNotifications = async (user) => {
  // Super Admin sees everything
  if (user.role === "SUPER_ADMIN") {
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Other users see:
  // - targeted to them (userId)
  // - for their branch (branchId)
  // - for their role (role)
  // - global (no userId/branchId/role)
  return prisma.notification.findMany({
    where: {
      OR: [
        { userId: user.id },
        user.branchId ? { branchId: user.branchId } : undefined,
        { role: user.role },
        { userId: null, branchId: null, role: null },
      ].filter(Boolean),
    },
    orderBy: { createdAt: "desc" },
  });
};

export const markAsRead = async (id, user) => {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new ApiError(404, "Notification not found");

  // Super Admin can mark any notification as read
  if (user.role === "SUPER_ADMIN") {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  const allowed =
    n.userId === user.id ||
    (n.branchId && user.branchId && n.branchId === user.branchId) ||
    (n.role && n.role === user.role) ||
    (!n.userId && !n.branchId && !n.role);

  if (!allowed) throw new ApiError(403, "Forbidden");

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};