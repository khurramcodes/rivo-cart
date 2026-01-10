import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { productRoutes } from "./product.routes.js";
import { orderRoutes } from "./order.routes.js";
import { imagekitRoutes } from "./imagekit.routes.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/products", productRoutes);
routes.use("/orders", orderRoutes);
routes.use("/imagekit", imagekitRoutes);


