// backend/src/routes/distributor.routes.js
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getDistributors,
  createDistributorController,
  updateDistributorController,
  deleteDistributorController,
} from "../controllers/distributor.controller.js";

const router = Router();

router.use(protect);

// View distributors
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getDistributors
);

// Create distributor
router.post(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  createDistributorController
);

// Update distributor
router.put(
  "/:id",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  updateDistributorController
);

// Delete distributor
router.delete(
  "/:id",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  deleteDistributorController
);

export default router;