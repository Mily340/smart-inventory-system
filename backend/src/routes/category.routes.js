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

// view (staff + branch staff)
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getCategories
);

// modify (admin + inventory only)
router.post("/", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), createCategoryController);
router.put("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), updateCategoryController);
router.delete("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), deleteCategoryController);

export default router;