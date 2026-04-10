import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  lowStockController,
  stockTransactionsController,
  ordersReportController,
  transfersReportController,
} from "../controllers/report.controller.js";

const router = Router();
router.use(protect);

// reports should be admin/manager/inventory
router.get(
  "/low-stock",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  lowStockController
);

router.get(
  "/stock-transactions",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  stockTransactionsController
);

router.get(
  "/orders",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  ordersReportController
);

router.get(
  "/transfers",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  transfersReportController
);

export default router;