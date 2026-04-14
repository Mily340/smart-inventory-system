import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  registerRequestController,
  listRequestsController,
  approveRequestController,
  rejectRequestController,
} from "../controllers/registrationRequest.controller.js";

const router = Router();

// Public: submit request
router.post("/register-request", registerRequestController);

// Admin: manage requests
router.get(
  "/admin/registration-requests",
  protect,
  allowRoles("SUPER_ADMIN"),
  listRequestsController
);

router.patch(
  "/admin/registration-requests/:id/approve",
  protect,
  allowRoles("SUPER_ADMIN"),
  approveRequestController
);

router.patch(
  "/admin/registration-requests/:id/reject",
  protect,
  allowRoles("SUPER_ADMIN"),
  rejectRequestController
);

export default router;