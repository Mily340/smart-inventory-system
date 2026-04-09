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

router.get("/", getOrders);

// create order (admin / inventory / branch manager)
router.post("/", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"), createOrderController);

// update order status (admin / branch manager)
router.patch("/:id/status", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER"), updateOrderStatusController);

export default router;