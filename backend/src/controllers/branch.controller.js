import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../services/branch.service.js";

export const getBranches = async (_req, res, next) => {
  try {
    const data = await getAllBranches();
    res.json({ success: true, message: "Branches fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createBranchController = async (req, res, next) => {
  try {
    const data = await createBranch(req.body);
    res.status(201).json({ success: true, message: "Branch created", data });
  } catch (e) {
    next(e);
  }
};

export const updateBranchController = async (req, res, next) => {
  try {
    const data = await updateBranch(req.params.id, req.body);
    res.json({ success: true, message: "Branch updated", data });
  } catch (e) {
    next(e);
  }
};

export const deleteBranchController = async (req, res, next) => {
  try {
    await deleteBranch(req.params.id);
    res.json({ success: true, message: "Branch deleted", data: null });
  } catch (e) {
    next(e);
  }
};