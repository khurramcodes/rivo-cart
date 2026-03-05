import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireCsrf } from "../../middlewares/csrf.js";
import * as wishlistController from "./wishlist.controller.js";

export const wishlistRoutes = Router();

wishlistRoutes.get("/", requireAuth, wishlistController.list);
wishlistRoutes.get("/ids", requireAuth, wishlistController.getIds);
wishlistRoutes.post("/toggle", requireAuth, requireCsrf, wishlistController.toggle);
