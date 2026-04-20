import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getOrders,
  createOrderController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const router = Router();
router.use(protect);

// view orders (staff + branch staff)
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getOrders
);

// create order (staff + branch staff)
router.post(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  createOrderController
);

// update order status
// ✅ allow BRANCH_STAFF here, BUT you must restrict in controller/service:
// - BRANCH_STAFF can only set status = "CANCELLED" (and only when current status is PENDING)
router.patch(
  "/:id/status",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  updateOrderStatusController
);

export default router;