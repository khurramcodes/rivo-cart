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

// admin (list must be before :orderNumber so GET / is not captured as orderNumber)
orderRoutes.get("/", requireAuth, requireRole("ADMIN"), orderController.listAll);

// customer: get own order by order number (requires auth, returns 404 if not owner)
orderRoutes.get("/:orderNumber", requireAuth, orderController.getByOrderNumber);
orderRoutes.put(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateOrderStatusSchema),
  orderController.updateStatus,
);


