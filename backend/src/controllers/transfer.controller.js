// backend/src/controllers/transfer.controller.js
import {
  listTransfers,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
} from "../services/transfer.service.js";
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

  return req.query.branchId || undefined;
};

const applyBranchScopeToBody = (req) => {
  const role = req.user?.role;

  if (BRANCH_SCOPED_ROLES.includes(role)) {
    if (!req.user?.branchId) {
      throw new ApiError(403, "No branch assigned to this user");
    }

    return {
      ...req.body,

      // For branch transfer request:
      // The manager/staff can only request stock for their assigned branch.
      toBranchId: req.user.branchId,
    };
  }

  return req.body;
};

export const getTransfers = async (req, res, next) => {
  try {
    const branchId = getAllowedBranchId(req);

    const data = await listTransfers({ branchId });

    res.json({
      success: true,
      message: "Transfers fetched",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const createTransferController = async (req, res, next) => {
  try {
    const scopedBody = applyBranchScopeToBody(req);

    const data = await createTransferRequest(scopedBody, req.user);

    res.status(201).json({
      success: true,
      message: "Transfer request created",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const approveTransferController = async (req, res, next) => {
  try {
    const data = await approveTransfer(req.params.id, req.user);

    res.json({
      success: true,
      message: "Transfer approved",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const rejectTransferController = async (req, res, next) => {
  try {
    const data = await rejectTransfer(req.params.id, req.user);

    res.json({
      success: true,
      message: "Transfer rejected",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const dispatchTransferController = async (req, res, next) => {
  try {
    const data = await dispatchTransfer(req.params.id, req.user);

    res.json({
      success: true,
      message: "Transfer dispatched",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const receiveTransferController = async (req, res, next) => {
  try {
    const data = await receiveTransfer(req.params.id, req.user);

    res.json({
      success: true,
      message: "Transfer received",
      data,
    });
  } catch (e) {
    next(e);
  }
};