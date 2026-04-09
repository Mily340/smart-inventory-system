import { listOrders, createOrder, updateOrderStatus } from "../services/order.service.js";

export const getOrders = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || undefined;
    const data = await listOrders({ branchId });
    res.json({ success: true, message: "Orders fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createOrderController = async (req, res, next) => {
  try {
    const data = await createOrder(req.body, req.user);
    res.status(201).json({ success: true, message: "Order created", data });
  } catch (e) {
    next(e);
  }
};

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const data = await updateOrderStatus(req.params.id, req.body, req.user);
    res.json({ success: true, message: "Order updated", data });
  } catch (e) {
    next(e);
  }
};