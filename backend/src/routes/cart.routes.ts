import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import * as cartController from "../controllers/cart.controller.js";
import {
  addCartItemSchema,
  applyCouponSchema,
  getCartSchema,
  migrateCartSchema,
  updateCartItemSchema,
} from "../validations/cart.validation.js";

export const cartRoutes = Router();

cartRoutes.get("/", validate(getCartSchema), cartController.getCart);
cartRoutes.post("/items", validate(addCartItemSchema), cartController.addItem);
cartRoutes.patch("/items/:id", validate(updateCartItemSchema), cartController.updateItem);
cartRoutes.delete("/items/:id", cartController.removeItem);
cartRoutes.post("/migrate", validate(migrateCartSchema), cartController.migrateCart);
cartRoutes.post("/coupon", validate(applyCouponSchema), cartController.applyCoupon);
cartRoutes.delete("/coupon", cartController.removeCoupon);
cartRoutes.get("/pricing", cartController.getPricing);
