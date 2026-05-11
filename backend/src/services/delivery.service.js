import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";

const nextCode = (prefix, lastNumber) => {
  const n = (lastNumber || 0) + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
};

const allowedTransitions = {
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "FAILED", "CANCELLED"],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

const notify = async (tx, { userId, branchId, title, message }) => {
  await tx.notification.create({
    data: {
      type: "GENERAL",
      title,
      message,
      userId: userId || null,
      branchId: branchId || null,
    },
  });
};

export const listDeliveries = async ({ branchId, riderId, orderId }) => {
  const where = {};

  if (riderId) where.riderId = riderId;
  if (orderId) where.orderId = orderId;

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          branch: true,
          distributor: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      rider: true,
      locations: {
        orderBy: {
          recordedAt: "desc",
        },
        take: 10,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!branchId) return deliveries;

  return deliveries.filter((delivery) => delivery.order?.branchId === branchId);
};

export const createDelivery = async ({ orderId, riderId, destinationAddress }, user) => {
  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  if (!riderId) {
    throw new ApiError(400, "riderId is required");
  }

  const cleanDestinationAddress = String(destinationAddress || "").trim();

  if (!cleanDestinationAddress) {
    throw new ApiError(400, "Destination address is required");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        branch: true,
        distributor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(400, "Invalid orderId");
    }

    if (!["APPROVED", "PACKED", "DISPATCHED"].includes(order.status)) {
      throw new ApiError(
        400,
        "Order must be APPROVED or PACKED (or DISPATCHED) to create delivery"
      );
    }

    const existingDelivery = await tx.delivery.findUnique({
      where: {
        orderId,
      },
    });

    if (existingDelivery) {
      throw new ApiError(409, "Delivery already exists for this order");
    }

    const rider = await tx.user.findUnique({
      where: {
        id: riderId,
      },
    });

    if (!rider) {
      throw new ApiError(400, "Invalid riderId");
    }

    if (rider.role !== "DELIVERY_RIDER") {
      throw new ApiError(400, "Selected user is not a DELIVERY_RIDER");
    }

    const last = await tx.delivery.findFirst({
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

    const lastNum = last?.code ? parseInt(String(last.code).replace("DL", ""), 10) : 0;
    const code = nextCode("DL", Number.isFinite(lastNum) ? lastNum : 0);

    const delivery = await tx.delivery.create({
      data: {
        code,
        orderId,
        riderId,
        status: "ASSIGNED",
        destinationAddress: cleanDestinationAddress,
      },
      include: {
        order: {
          include: {
            branch: true,
            distributor: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        rider: true,
      },
    });

    await notify(tx, {
      branchId: order.branchId,
      title: "Delivery assigned",
      message: `Delivery ${delivery.code || delivery.id} assigned for Order ${
        order.code || order.id
      } to rider ${rider.fullName}`,
    });

    await notify(tx, {
      userId: riderId,
      title: "New delivery assigned",
      message: `You have been assigned Delivery ${delivery.code || delivery.id} for Order ${
        order.code || order.id
      }`,
    });

    return delivery;
  });
};

export const updateDeliveryStatus = async (id, { status }, user) => {
  if (!status) {
    throw new ApiError(400, "status is required");
  }

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: {
        id,
      },
      include: {
        order: true,
        rider: true,
      },
    });

    if (!delivery) {
      throw new ApiError(404, "Delivery not found");
    }

    const isPrivileged = ["SUPER_ADMIN", "BRANCH_MANAGER"].includes(user.role);

    if (!isPrivileged && delivery.riderId !== user.id) {
      throw new ApiError(403, "Forbidden");
    }

    const current = delivery.status;
    const allowed = allowedTransitions[current] || [];

    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition: ${current} -> ${status}`);
    }

    const updated = await tx.delivery.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        order: true,
        rider: true,
      },
    });

    if (["PICKED_UP", "IN_TRANSIT"].includes(status)) {
      if (updated.order.status !== "DISPATCHED" && updated.order.status !== "DELIVERED") {
        await tx.order.update({
          where: {
            id: updated.orderId,
          },
          data: {
            status: "DISPATCHED",
          },
        });
      }
    }

    if (status === "DELIVERED") {
      await tx.order.update({
        where: {
          id: updated.orderId,
        },
        data: {
          status: "DELIVERED",
        },
      });
    }

    await notify(tx, {
      branchId: updated.order.branchId,
      title: "Delivery status updated",
      message: `Delivery ${updated.code || updated.id} status is now ${
        updated.status
      } (Order ${updated.order.code || updated.order.id})`,
    });

    await notify(tx, {
      userId: updated.riderId,
      title: "Delivery status updated",
      message: `Delivery ${updated.code || updated.id} status is now ${updated.status}`,
    });

    return updated;
  });
};

export const addDeliveryLocation = async (id, { latitude, longitude }, user) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "latitude and longitude must be valid numbers");
  }

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: {
        id,
      },
    });

    if (!delivery) {
      throw new ApiError(404, "Delivery not found");
    }

    const isPrivileged = ["SUPER_ADMIN", "BRANCH_MANAGER"].includes(user.role);

    if (!isPrivileged && delivery.riderId !== user.id) {
      throw new ApiError(403, "Forbidden");
    }

    const loc = await tx.deliveryLocation.create({
      data: {
        deliveryId: id,
        latitude: lat,
        longitude: lng,
      },
    });

    return loc;
  });
};