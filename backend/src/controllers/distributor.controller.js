import { getAllDistributors, createDistributor } from "../services/distributor.service.js";

export const getDistributors = async (_req, res, next) => {
  try {
    const data = await getAllDistributors();
    res.json({ success: true, message: "Distributors fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createDistributorController = async (req, res, next) => {
  try {
    const data = await createDistributor(req.body);
    res.status(201).json({ success: true, message: "Distributor created", data });
  } catch (e) {
    next(e);
  }
};