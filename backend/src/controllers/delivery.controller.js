import {
  listDeliveries,
  createDelivery,
  updateDeliveryStatus,
  addDeliveryLocation,
} from "../services/delivery.service.js";

export const getDeliveries = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || undefined;
    const riderId = req.query.riderId || undefined;
    const orderId = req.query.orderId || undefined;

    const data = await listDeliveries({ branchId, riderId, orderId });
    res.json({ success: true, message: "Deliveries fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createDeliveryController = async (req, res, next) => {
  try {
    const data = await createDelivery(req.body, req.user);
    res.status(201).json({ success: true, message: "Delivery created", data });
  } catch (e) {
    next(e);
  }
};

export const updateDeliveryStatusController = async (req, res, next) => {
  try {
    const data = await updateDeliveryStatus(req.params.id, req.body, req.user);
    res.json({ success: true, message: "Delivery updated", data });
  } catch (e) {
    next(e);
  }
};

export const addLocationController = async (req, res, next) => {
  try {
    const data = await addDeliveryLocation(req.params.id, req.body, req.user);
    res.status(201).json({ success: true, message: "Location recorded", data });
  } catch (e) {
    next(e);
  }
};