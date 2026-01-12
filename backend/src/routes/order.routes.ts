import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as orderController from "../controllers/order.controller.js";
import { placeOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";

export const orderRoutes = Router();

// customer (both USER and ADMIN can place orders)
orderRoutes.post("/", requireAuth, requireCsrf, validate(placeOrderSchema), orderController.place);

// admin
orderRoutes.get("/", requireAuth, requireRole("ADMIN"), orderController.listAll);
orderRoutes.put(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateOrderStatusSchema),
  orderController.updateStatus,
);


