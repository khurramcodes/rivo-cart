import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as qaController from "../controllers/qa.public.controller.js";
import {
  questionIdParamSchema,
  reportQuestionSchema,
  answerIdParamSchema,
  markAnswerHelpfulSchema,
  reportAnswerSchema,
} from "../validations/qa.validation.js";

export const qaRoutes = Router();

qaRoutes.post("/questions/:id/report", requireAuth, requireCsrf, validate(reportQuestionSchema), qaController.reportQuestion);
qaRoutes.put("/answers/:id/helpful", requireAuth, requireCsrf, validate(markAnswerHelpfulSchema), qaController.markAnswerHelpful);
qaRoutes.get("/answers/:id/helpful", requireAuth, validate(answerIdParamSchema), qaController.myAnswerHelpful);
qaRoutes.post("/answers/:id/report", requireAuth, requireCsrf, validate(reportAnswerSchema), qaController.reportAnswer);
