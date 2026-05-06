import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

const INACTIVE_BRANCH_MESSAGE =
  "Your branch is inactive or deactivated for now. Please contact the respective authority.";

const BRANCH_RESTRICTED_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];

export const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (BRANCH_RESTRICTED_ROLES.includes(user.role)) {
      if (!user.branchId || !user.branch) {
        return next(
          new ApiError(
            403,
            "No active branch is assigned to this account. Please contact the respective authority."
          )
        );
      }

      if (!user.branch.isActive) {
        return next(new ApiError(403, INACTIVE_BRANCH_MESSAGE));
      }
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      branchIsActive: user.branch ? Boolean(user.branch.isActive) : true,
      branch: user.branch,
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};