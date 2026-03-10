import { Router } from "express";
import {
  getBranches,
  createBranchController,
  updateBranchController,
  deleteBranchController,
} from "../controllers/branch.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getBranches);
router.post("/", allowRoles("SUPER_ADMIN"), createBranchController);
router.put("/:id", allowRoles("SUPER_ADMIN"), updateBranchController);
router.delete("/:id", allowRoles("SUPER_ADMIN"), deleteBranchController);

export default router;