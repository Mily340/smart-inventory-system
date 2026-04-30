// backend/src/controllers/report.controller.js
import {
  lowStockReport,
  stockTransactionsReport,
  ordersReport,
  transfersReport,
} from "../services/report.service.js";
import ApiError from "../utils/ApiError.js";

const getScopedBranchId = (req) => {
  const role = req.user?.role;

  if (role === "BRANCH_MANAGER") {
    if (!req.user?.branchId) {
      throw new ApiError(403, "No branch assigned to this user");
    }

    return req.user.branchId;
  }

  return req.query.branchId || undefined;
};

export const lowStockController = async (req, res, next) => {
  try {
    const branchId = getScopedBranchId(req);
    const data = await lowStockReport({ branchId });

    res.json({
      success: true,
      message: "Low stock report",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const stockTransactionsController = async (req, res, next) => {
  try {
    const branchId = getScopedBranchId(req);
    const { productId, from, to } = req.query;

    const data = await stockTransactionsReport({
      branchId,
      productId,
      from,
      to,
    });

    res.json({
      success: true,
      message: "Stock transactions report",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const ordersReportController = async (req, res, next) => {
  try {
    const branchId = getScopedBranchId(req);
    const { status, from, to } = req.query;

    const data = await ordersReport({
      branchId,
      status,
      from,
      to,
    });

    res.json({
      success: true,
      message: "Orders report",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const transfersReportController = async (req, res, next) => {
  try {
    const branchId = getScopedBranchId(req);
    const { status, from, to } = req.query;

    const data = await transfersReport({
      branchId,
      status,
      from,
      to,
    });

    res.json({
      success: true,
      message: "Transfers report",
      data,
    });
  } catch (e) {
    next(e);
  }
};