import {
  createRegistrationRequest,
  listRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from "../services/registrationRequest.service.js";

export const registerRequestController = async (req, res, next) => {
  try {
    const data = await createRegistrationRequest(req.body);
    res.status(201).json({ success: true, message: "Registration request submitted", data });
  } catch (e) {
    next(e);
  }
};

export const listRequestsController = async (req, res, next) => {
  try {
    const status = req.query.status || undefined;
    const data = await listRegistrationRequests({ status });
    res.json({ success: true, message: "Registration requests fetched", data });
  } catch (e) {
    next(e);
  }
};

export const approveRequestController = async (req, res, next) => {
  try {
    const data = await approveRegistrationRequest(req.params.id, req.user);
    res.json({ success: true, message: "Request approved, user created", data });
  } catch (e) {
    next(e);
  }
};

export const rejectRequestController = async (req, res, next) => {
  try {
    const reason = req.body?.reason || "";
    await rejectRegistrationRequest(req.params.id, req.user, reason);
    res.json({ success: true, message: "Request rejected" });
  } catch (e) {
    next(e);
  }
};