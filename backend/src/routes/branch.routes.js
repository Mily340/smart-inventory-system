import { Router } from "express";
import prisma from "../db/prisma.js";
import {
  getBranches,
  createBranchController,
  updateBranchController,
  deleteBranchController,
} from "../controllers/branch.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

/**
 * Public: branch list for registration dropdown
 * GET /api/v1/branches/public
 */
router.get("/public", async (_req, res, next) => {
  try {
    const list = await prisma.branch.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, name: true },
    });

    return res.json({ success: true, message: "Branches fetched", data: list });
  } catch (e) {
    next(e);
  }
});

// Protected routes (everything below requires login)
router.use(protect);

// view (staff + branch staff)
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getBranches
);

// modify (super admin only)
router.post("/", allowRoles("SUPER_ADMIN"), createBranchController);
router.put("/:id", allowRoles("SUPER_ADMIN"), updateBranchController);
router.delete("/:id", allowRoles("SUPER_ADMIN"), deleteBranchController);

export default router;