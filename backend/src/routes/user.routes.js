import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetUserPasswordController, // ✅ ADD
} from "../controllers/user.controller.js";

const router = Router();

router.use(protect);
router.use(allowRoles("SUPER_ADMIN"));

router.get("/", listUsersController);
router.post("/", createUserController);
router.patch("/:id", updateUserController);

// ✅ NEW: reset password (SUPER_ADMIN only)
router.patch("/:id/reset-password", resetUserPasswordController);

router.delete("/:id", deleteUserController);

export default router;