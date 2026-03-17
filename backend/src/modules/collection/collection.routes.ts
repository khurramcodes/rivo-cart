import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { requireCsrf } from "../../middlewares/csrf.js";
import * as collectionController from "./collection.controller.js";
import {
  collectionProductsBodySchema,
  createCollectionSchema,
  idParamSchema,
  removeCollectionProductSchema,
  reorderCollectionProductsSchema,
  slugParamSchema,
  updateCollectionSchema,
} from "./collection.utils.js";

export const adminCollectionRoutes = Router();
export const collectionRoutes = Router();

adminCollectionRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(createCollectionSchema),
  collectionController.create,
);

adminCollectionRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  collectionController.listAdmin,
);

adminCollectionRoutes.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(idParamSchema),
  collectionController.getById,
);

adminCollectionRoutes.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateCollectionSchema),
  collectionController.update,
);

adminCollectionRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  collectionController.remove,
);

adminCollectionRoutes.post(
  "/:id/products",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(collectionProductsBodySchema),
  collectionController.addProducts,
);

adminCollectionRoutes.put(
  "/:id/products/reorder",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(reorderCollectionProductsSchema),
  collectionController.reorderProducts,
);

adminCollectionRoutes.delete(
  "/:id/products/:productId",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(removeCollectionProductSchema),
  collectionController.removeProduct,
);

collectionRoutes.get("/", collectionController.listPublic);
collectionRoutes.get("/:slug/products", validate(slugParamSchema), collectionController.getPublicCollectionProducts);
