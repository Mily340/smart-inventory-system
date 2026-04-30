// backend/src/controllers/distributor.controller.js
import {
  getAllDistributors,
  createDistributor,
  updateDistributor,
  deleteDistributor,
} from "../services/distributor.service.js";

export const getDistributors = async (_req, res, next) => {
  try {
    const data = await getAllDistributors();

    res.json({
      success: true,
      message: "Distributors fetched",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const createDistributorController = async (req, res, next) => {
  try {
    const data = await createDistributor(req.body);

    res.status(201).json({
      success: true,
      message: "Distributor created",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const updateDistributorController = async (req, res, next) => {
  try {
    const data = await updateDistributor(req.params.id, req.body);

    res.json({
      success: true,
      message: "Distributor updated",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const deleteDistributorController = async (req, res, next) => {
  try {
    await deleteDistributor(req.params.id);

    res.json({
      success: true,
      message: "Distributor deleted",
    });
  } catch (e) {
    next(e);
  }
};