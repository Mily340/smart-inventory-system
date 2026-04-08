import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getProducts,
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

const router = Router();

router.use(protect);

router.get("/", getProducts);
router.post("/", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), createProductController);
router.put("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), updateProductController);
router.delete("/:id", allowRoles("SUPER_ADMIN", "INVENTORY_OFFICER"), deleteProductController);

export default router;