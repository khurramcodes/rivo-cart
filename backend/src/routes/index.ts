import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { productRoutes } from "./product.routes.js";
import { orderRoutes } from "./order.routes.js";
import { imagekitRoutes } from "./imagekit.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { cartRoutes } from "./cart.routes.js";
import { addressRoutes } from "./address.routes.js";
import { discountRoutes } from "./discount.routes.js";
import { couponRoutes } from "./coupon.routes.js";
import { pricingRoutes } from "./pricing.routes.js";
import { shippingRoutes } from "./shipping.routes.js";
import { reviewRoutes } from "./review.routes.js";
import { reviewAdminRoutes } from "./review.admin.routes.js";
import { qaRoutes } from "./qa.routes.js";
import { qaAdminRoutes } from "./qa.admin.routes.js";
import { notificationAdminRoutes } from "./notification.admin.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/orders", orderRoutes);
routes.use("/imagekit", imagekitRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/cart", cartRoutes);
routes.use("/addresses", addressRoutes);
routes.use("/discounts", discountRoutes);
routes.use("/coupons", couponRoutes);
routes.use("/pricing", pricingRoutes);
routes.use("/shipping", shippingRoutes);
routes.use("/reviews", reviewRoutes);
routes.use("/admin/reviews", reviewAdminRoutes);
routes.use("/qa", qaRoutes);
routes.use("/admin/qa", qaAdminRoutes);
routes.use("/admin/notifications", notificationAdminRoutes);


