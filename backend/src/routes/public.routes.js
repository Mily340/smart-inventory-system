import { Router } from "express";
import {
  publicCategories,
  publicProducts,
  publicProductById,
} from "../controllers/public.controller.js";

const router = Router();

// Public catalog (NO auth)
router.get("/public/categories", publicCategories);
router.get("/public/products", publicProducts);
router.get("/public/products/:id", publicProductById);

export default router;