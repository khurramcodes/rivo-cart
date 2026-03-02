import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as productController from "../controllers/product.controller.js";
import {
  bestSellingProductsSchema,
  createProductSchema,
  idParamSchema,
  listProductsSchema,
  updateProductSchema,
} from "../validations/product.validation.js";
import * as reviewPublicController from "../controllers/review.public.controller.js";
import { listProductReviewsSchema, topProductReviewsSchema } from "../validations/review.validation.js";
import * as qaPublicController from "../controllers/qa.public.controller.js";
import { listQuestionsSchema, createQuestionSchema } from "../validations/qa.validation.js";

export const productRoutes = Router();

// public
productRoutes.get("/", validate(listProductsSchema), productController.list);

productRoutes.get("/latest", validate(listProductsSchema), productController.latest);
productRoutes.get("/best-selling", validate(bestSellingProductsSchema), productController.bestSelling);

productRoutes.get("/:id", validate(idParamSchema), productController.get);

// reviews (public - approved only)
productRoutes.get("/:productId/reviews", validate(listProductReviewsSchema), reviewPublicController.listApprovedForProduct);
productRoutes.get("/:productId/reviews/top", validate(topProductReviewsSchema), reviewPublicController.topApprovedForProduct);

// Q&A (public)
productRoutes.get("/:productId/questions", validate(listQuestionsSchema), qaPublicController.listQuestions);
productRoutes.post("/:productId/questions", requireAuth, requireCsrf, validate(createQuestionSchema), qaPublicController.createQuestion);

// admin
productRoutes.post("/", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createProductSchema), productController.create);
productRoutes.put("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateProductSchema), productController.update);
productRoutes.delete("/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), productController.remove);


