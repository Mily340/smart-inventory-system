import { Router } from "express";
import authRoutes from "./auth.routes.js";
import branchRoutes from "./branch.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/branches", branchRoutes);

export default router;