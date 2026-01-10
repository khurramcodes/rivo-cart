import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as categoryController from "../controllers/category.controller.js";
import { createCategorySchema, idParamSchema, updateCategorySchema } from "../validations/category.validation.js";

export const categoryRoutes = Router();

// public
categoryRoutes.get("/", categoryController.list);

// admin
categoryRoutes.post("/", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createCategorySchema), categoryController.create);
categoryRoutes.put("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateCategorySchema), categoryController.update);
categoryRoutes.delete("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), categoryController.remove);


