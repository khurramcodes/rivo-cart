import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as reviewController from "../controllers/review.controller.js";
import { createReviewSchema, myReviewSchema, updateReviewSchema } from "../validations/review.validation.js";

export const reviewRoutes = Router();

reviewRoutes.get("/me", requireAuth, validate(myReviewSchema), reviewController.mine);
reviewRoutes.post("/", requireAuth, requireCsrf, validate(createReviewSchema), reviewController.create);
reviewRoutes.put("/:id", requireAuth, requireCsrf, validate(updateReviewSchema), reviewController.update);

