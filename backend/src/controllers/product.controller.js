import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";

export const getProducts = async (_req, res, next) => {
  try {
    const data = await getAllProducts();
    res.json({ success: true, message: "Products fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createProductController = async (req, res, next) => {
  try {
    const data = await createProduct(req.body);
    res.status(201).json({ success: true, message: "Product created", data });
  } catch (e) {
    next(e);
  }
};

export const updateProductController = async (req, res, next) => {
  try {
    const data = await updateProduct(req.params.id, req.body);
    res.json({ success: true, message: "Product updated", data });
  } catch (e) {
    next(e);
  }
};

export const deleteProductController = async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true, message: "Product deleted", data: null });
  } catch (e) {
    next(e);
  }
};