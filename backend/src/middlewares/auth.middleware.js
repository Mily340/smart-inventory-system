import prisma from "../db/prisma.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

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
      },
    });

    if (!user) return next(new ApiError(401, "Unauthorized"));

    req.user = user;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};