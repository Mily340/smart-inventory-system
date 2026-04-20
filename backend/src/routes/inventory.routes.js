import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getInventory,
  stockInController,
  stockOutController,
  adjustController,
  reorderLevelController,
} from "../controllers/inventory.controller.js";

const router = Router();
router.use(protect);

// View inventory (staff + branch staff)
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getInventory
);

// Stock operations (warehouse/admin/inventory roles)
router.post(
  "/stock-in",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  stockInController
);

router.post(
  "/stock-out",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  stockOutController
);

router.post(
  "/adjust",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  adjustController
);

// Reorder level update (for low-stock alert feature)
router.patch(
  "/reorder-level",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  reorderLevelController
);

export default router;