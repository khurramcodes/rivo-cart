import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as qaController from "../controllers/qa.public.controller.js";
import {
  answerIdParamSchema,
  setAnswerHelpfulSchema,
} from "../validations/qa.validation.js";

export const qaRoutes = Router();

qaRoutes.put("/answers/:id/helpful", requireAuth, requireCsrf, validate(setAnswerHelpfulSchema), qaController.setAnswerHelpful);
qaRoutes.get("/answers/:id/helpful", requireAuth, validate(answerIdParamSchema), qaController.myAnswerHelpful);
