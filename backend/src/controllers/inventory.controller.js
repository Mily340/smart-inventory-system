import {
  listInventory,
  stockIn,
  stockOut,
  adjustStock,
  updateReorderLevel,
} from "../services/inventory.service.js";

export const getInventory = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || undefined;
    const data = await listInventory({ branchId });
    res.json({ success: true, message: "Inventory fetched", data });
  } catch (e) {
    next(e);
  }
};

export const stockInController = async (req, res, next) => {
  try {
    const data = await stockIn(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Stock added", data });
  } catch (e) {
    next(e);
  }
};

export const stockOutController = async (req, res, next) => {
  try {
    const data = await stockOut(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Stock removed", data });
  } catch (e) {
    next(e);
  }
};

export const adjustController = async (req, res, next) => {
  try {
    const data = await adjustStock(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Stock adjusted", data });
  } catch (e) {
    next(e);
  }
};

export const reorderLevelController = async (req, res, next) => {
  try {
    const data = await updateReorderLevel(req.body);
    res.status(200).json({ success: true, message: "Reorder level updated", data });
  } catch (e) {
    next(e);
  }
};