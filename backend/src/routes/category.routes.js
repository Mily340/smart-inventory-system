import { Router } from "express";
import {
  getCategories,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getCategories);
router.post("/", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), createCategoryController);
router.put("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), updateCategoryController);
router.delete("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), deleteCategoryController);

export default router;