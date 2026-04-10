import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getDeliveries,
  createDeliveryController,
  updateDeliveryStatusController,
  addLocationController,
} from "../controllers/delivery.controller.js";

const router = Router();
router.use(protect);

// list deliveries (any logged-in user)
router.get("/", getDeliveries);

// create/assign delivery (admin/branch manager/inventory)
router.post(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  createDeliveryController
);

// update status (rider can update own; roles checked in service too)
router.patch(
  "/:id/status",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "DELIVERY_RIDER"),
  updateDeliveryStatusController
);

// add location (rider can add own; roles checked in service too)
router.post(
  "/:id/location",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "DELIVERY_RIDER"),
  addLocationController
);

export default router;