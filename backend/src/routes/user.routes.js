// backend/src/routes/user.routes.js
import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetUserPasswordController,
  listRidersController,
} from "../controllers/user.controller.js";

const router = Router();

router.use(protect);

/*
  Rider list endpoint for delivery creation.
  This must be before SUPER_ADMIN-only middleware.
*/
router.get(
  "/riders",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"),
  listRidersController
);

/*
  User management routes remain SUPER_ADMIN-only.
*/
router.use(allowRoles("SUPER_ADMIN"));

router.get("/", listUsersController);
router.post("/", createUserController);
router.patch("/:id", updateUserController);
router.patch("/:id/reset-password", resetUserPasswordController);
router.delete("/:id", deleteUserController);

export default router;