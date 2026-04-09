import {
  listTransfers,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
} from "../services/transfer.service.js";

export const getTransfers = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || undefined;
    const data = await listTransfers({ branchId });
    res.json({ success: true, message: "Transfers fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createTransferController = async (req, res, next) => {
  try {
    const data = await createTransferRequest(req.body, req.user);
    res.status(201).json({ success: true, message: "Transfer request created", data });
  } catch (e) {
    next(e);
  }
};

export const approveTransferController = async (req, res, next) => {
  try {
    const data = await approveTransfer(req.params.id, req.user);
    res.json({ success: true, message: "Transfer approved", data });
  } catch (e) {
    next(e);
  }
};

export const rejectTransferController = async (req, res, next) => {
  try {
    const data = await rejectTransfer(req.params.id, req.user);
    res.json({ success: true, message: "Transfer rejected", data });
  } catch (e) {
    next(e);
  }
};

export const dispatchTransferController = async (req, res, next) => {
  try {
    const data = await dispatchTransfer(req.params.id, req.user);
    res.json({ success: true, message: "Transfer dispatched", data });
  } catch (e) {
    next(e);
  }
};

export const receiveTransferController = async (req, res, next) => {
  try {
    const data = await receiveTransfer(req.params.id, req.user);
    res.json({ success: true, message: "Transfer received", data });
  } catch (e) {
    next(e);
  }
};