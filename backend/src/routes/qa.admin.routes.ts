import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as qaAdminController from "../controllers/qa.admin.controller.js";
import {
  adminListQuestionsSchema,
  questionIdParamSchema,
  adminCreateAnswerSchema,
  adminUpdateAnswerSchema,
  answerIdParamSchema,
} from "../validations/qa.validation.js";

export const qaAdminRoutes = Router();

qaAdminRoutes.get("/questions", requireAuth, requireRole("ADMIN"), validate(adminListQuestionsSchema), qaAdminController.listQuestions);
qaAdminRoutes.patch("/questions/:id/hide", requireAuth, requireRole("ADMIN"), requireCsrf, validate(questionIdParamSchema), qaAdminController.hideQuestion);
qaAdminRoutes.patch("/questions/:id/remove", requireAuth, requireRole("ADMIN"), requireCsrf, validate(questionIdParamSchema), qaAdminController.removeQuestion);
qaAdminRoutes.post("/questions/:id/answers", requireAuth, requireRole("ADMIN"), requireCsrf, validate(adminCreateAnswerSchema), qaAdminController.createAnswer);
qaAdminRoutes.put("/answers/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(adminUpdateAnswerSchema), qaAdminController.updateAnswer);
qaAdminRoutes.patch("/answers/:id/hide", requireAuth, requireRole("ADMIN"), requireCsrf, validate(answerIdParamSchema), qaAdminController.hideAnswer);
qaAdminRoutes.patch("/answers/:id/remove", requireAuth, requireRole("ADMIN"), requireCsrf, validate(answerIdParamSchema), qaAdminController.removeAnswer);
