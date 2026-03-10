import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", protect, allowRoles("SUPER_ADMIN"), register);

export default router;