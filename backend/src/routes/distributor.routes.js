import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getDistributors,
  createDistributorController,
} from "../controllers/distributor.controller.js";

const router = Router();
router.use(protect);

// view (staff + branch staff)
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getDistributors
);

// create (staff only)
router.post(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  createDistributorController
);

export default router;