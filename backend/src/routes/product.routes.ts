import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as productController from "../controllers/product.controller.js";
import * as productAdminController from "../controllers/productAdmin.controller.js";
import { createProductSchema, idParamSchema, listProductsSchema, updateProductSchema } from "../validations/product.validation.js";

export const productRoutes = Router();

// public
productRoutes.get("/", validate(listProductsSchema), productController.list);

productRoutes.get("/latest", validate(listProductsSchema), productController.latest);

productRoutes.get("/:id", validate(idParamSchema), productController.get);

// admin
productRoutes.get(
  "/admin/new-id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  productAdminController.newProductId,
);
productRoutes.post("/", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createProductSchema), productController.create);
productRoutes.put("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateProductSchema), productController.update);
productRoutes.delete("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), productController.remove);


