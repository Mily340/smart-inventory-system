import { Router } from "express";
import authRoutes from "./auth.routes.js";
import branchRoutes from "./branch.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import notificationRoutes from "./notification.routes.js";
import transferRoutes from "./transfer.routes.js";
import orderRoutes from "./order.routes.js";
import distributorRoutes from "./distributor.routes.js";
import deliveryRoutes from "./delivery.routes.js";
import reportRoutes from "./report.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/branches", branchRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/transfers", transferRoutes);
router.use("/orders", orderRoutes);
router.use("/distributors", distributorRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/reports", reportRoutes);

export default router;