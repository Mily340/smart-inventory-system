import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  getTransfers,
  createTransferController,
  approveTransferController,
  rejectTransferController,
  dispatchTransferController,
  receiveTransferController,
} from "../controllers/transfer.controller.js";

const router = Router();
router.use(protect);

// list transfers
router.get("/", getTransfers);

// create request (admin/branch/inventory)
router.post("/", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"), createTransferController);

// approve/reject (admin/branch manager)
router.patch("/:id/approve", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER"), approveTransferController);
router.patch("/:id/reject", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER"), rejectTransferController);

// dispatch/receive (admin/branch/inventory)
router.patch("/:id/dispatch", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"), dispatchTransferController);
router.patch("/:id/receive", allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"), receiveTransferController);

export default router;