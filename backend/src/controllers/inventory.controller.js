// backend/src/controllers/inventory.controller.js
import {
  listInventory,
  stockIn,
  stockOut,
  adjustStock,
  updateReorderLevel,
} from "../services/inventory.service.js";
import ApiError from "../utils/ApiError.js";

const BRANCH_SCOPED_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];

const getAllowedBranchId = (req) => {
  const role = req.user?.role;

  if (BRANCH_SCOPED_ROLES.includes(role)) {
    if (!req.user?.branchId) {
      throw new ApiError(403, "No branch assigned to this user");
    }

    return req.user.branchId;
  }

  return req.query.branchId || req.body.branchId || undefined;
};

const applyBranchScopeToBody = (req) => {
  const role = req.user?.role;

  if (BRANCH_SCOPED_ROLES.includes(role)) {
    if (!req.user?.branchId) {
      throw new ApiError(403, "No branch assigned to this user");
    }

    return {
      ...req.body,
      branchId: req.user.branchId,
    };
  }

  return req.body;
};

export const getInventory = async (req, res, next) => {
  try {
    const branchId = getAllowedBranchId(req);

    const data = await listInventory({ branchId });

    res.json({
      success: true,
      message: "Inventory fetched",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const stockInController = async (req, res, next) => {
  try {
    const scopedBody = applyBranchScopeToBody(req);

    const data = await stockIn(scopedBody, req.user.id);

    res.status(201).json({
      success: true,
      message: "Stock added",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const stockOutController = async (req, res, next) => {
  try {
    const scopedBody = applyBranchScopeToBody(req);

    const data = await stockOut(scopedBody, req.user.id);

    res.status(201).json({
      success: true,
      message: "Stock removed",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const adjustController = async (req, res, next) => {
  try {
    const scopedBody = applyBranchScopeToBody(req);

    const data = await adjustStock(scopedBody, req.user.id);

    res.status(201).json({
      success: true,
      message: "Stock adjusted",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const reorderLevelController = async (req, res, next) => {
  try {
    const scopedBody = applyBranchScopeToBody(req);

    const data = await updateReorderLevel(scopedBody);

    res.status(200).json({
      success: true,
      message: "Reorder level updated",
      data,
    });
  } catch (e) {
    next(e);
  }
};