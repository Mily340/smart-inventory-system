import { Router } from "express";
import prisma from "../db/prisma.js";
import {
  getBranches,
  createBranchController,
  updateBranchController,
  deleteBranchController,
  activateBranchController,
  deactivateBranchController,
} from "../controllers/branch.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = Router();

/**
 * Public: active branch list for registration dropdown
 * GET /api/v1/branches/public
 */
router.get("/public", async (_req, res, next) => {
  try {
    const list = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, name: true, isActive: true },
    });

    return res.json({ success: true, message: "Branches fetched", data: list });
  } catch (e) {
    next(e);
  }
});

// Protected routes
router.use(protect);

// View branches
router.get(
  "/",
  allowRoles("SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF"),
  getBranches
);

// Modify branches - Super Admin only
router.post("/", allowRoles("SUPER_ADMIN"), createBranchController);
router.put("/:id", allowRoles("SUPER_ADMIN"), updateBranchController);

// Activate / Deactivate branch - Super Admin only
router.patch("/:id/activate", allowRoles("SUPER_ADMIN"), activateBranchController);
router.patch("/:id/deactivate", allowRoles("SUPER_ADMIN"), deactivateBranchController);

// Delete branch - Super Admin only
router.delete("/:id", allowRoles("SUPER_ADMIN"), deleteBranchController);

export default router;