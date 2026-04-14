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

/**
 * Public: branch list for registration dropdown
 * GET /api/v1/branches/public
 */
router.get("/public", async (_req, res, next) => {
  try {
    // reuse existing handler output then reduce fields
    // we call the service through getBranches by mimicking req/res is messy,
    // so simplest is to just fetch directly here using controller logic.
    // If your getBranches already returns all branches, this keeps it safe.
    // (Assumes Prisma is used in controller/service.)
    // We'll just call getBranches and then map the response.
    let capturedJson;
    const fakeRes = {
      json: (payload) => {
        capturedJson = payload;
        return payload;
      },
      status: () => fakeRes,
    };

    await getBranches(_req, fakeRes, next);

    const list = capturedJson?.data || [];
    const minimal = list.map((b) => ({
      id: b.id,
      code: b.code || null,
      name: b.name,
    }));

    return res.json({ success: true, message: "Branches fetched", data: minimal });
  } catch (e) {
    next(e);
  }
});

// Protected routes (everything below requires login)
router.use(protect);

router.get("/", getBranches);
router.post("/", allowRoles("SUPER_ADMIN"), createBranchController);
router.put("/:id", allowRoles("SUPER_ADMIN"), updateBranchController);
router.delete("/:id", allowRoles("SUPER_ADMIN"), deleteBranchController);

export default router;