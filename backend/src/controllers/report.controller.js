import {
  lowStockReport,
  stockTransactionsReport,
  ordersReport,
  transfersReport,
} from "../services/report.service.js";

export const lowStockController = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || undefined;
    const data = await lowStockReport({ branchId });
    res.json({ success: true, message: "Low stock report", data });
  } catch (e) {
    next(e);
  }
};

export const stockTransactionsController = async (req, res, next) => {
  try {
    const { branchId, productId, from, to } = req.query;
    const data = await stockTransactionsReport({ branchId, productId, from, to });
    res.json({ success: true, message: "Stock transactions report", data });
  } catch (e) {
    next(e);
  }
};

export const ordersReportController = async (req, res, next) => {
  try {
    const { branchId, status, from, to } = req.query;
    const data = await ordersReport({ branchId, status, from, to });
    res.json({ success: true, message: "Orders report", data });
  } catch (e) {
    next(e);
  }
};

export const transfersReportController = async (req, res, next) => {
  try {
    const { branchId, status, from, to } = req.query;
    const data = await transfersReport({ branchId, status, from, to });
    res.json({ success: true, message: "Transfers report", data });
  } catch (e) {
    next(e);
  }
};