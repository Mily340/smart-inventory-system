import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

export const getCategories = async (_req, res, next) => {
  try {
    const data = await getAllCategories();
    res.json({ success: true, message: "Categories fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createCategoryController = async (req, res, next) => {
  try {
    const data = await createCategory(req.body);
    res.status(201).json({ success: true, message: "Category created", data });
  } catch (e) {
    next(e);
  }
};

export const updateCategoryController = async (req, res, next) => {
  try {
    const data = await updateCategory(req.params.id, req.body);
    res.json({ success: true, message: "Category updated", data });
  } catch (e) {
    next(e);
  }
};

export const deleteCategoryController = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deleted", data: null });
  } catch (e) {
    next(e);
  }
};