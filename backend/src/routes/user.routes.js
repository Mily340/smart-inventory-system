import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { listUsersController, updateUserController, deleteUserController } from "../controllers/user.controller.js";

const router = Router();

router.use(protect);
router.use(allowRoles("SUPER_ADMIN"));

router.get("/", listUsersController);
router.patch("/:id", updateUserController);
router.delete("/:id", deleteUserController);

export default router;