import type { Request, Response } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as storageService from "../services/storage.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "INVALID_FILE_TYPE", "Only JPEG, PNG, WebP, GIF allowed"));
    }
  },
});

const uploadSingle = upload.single("file");

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  await new Promise<void>((resolve, reject) => {
    uploadSingle(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const file = req.file;
  if (!file) {
    throw new ApiError(400, "MISSING_FILE", "file is required");
  }

  const resourceId = (req.body.resourceId as string)?.trim();
  const resourceType = (req.body.resourceType as string)?.trim();
  const fileType = (req.body.fileType as string)?.trim();
  const slug = (req.body.slug as string)?.trim();

  if (!resourceId) {
    throw new ApiError(400, "MISSING_RESOURCE_ID", "resourceId is required");
  }
  if (!resourceType) {
    throw new ApiError(400, "MISSING_RESOURCE_TYPE", "resourceType is required");
  }
  if (!fileType) {
    throw new ApiError(400, "MISSING_FILE_TYPE", "fileType is required");
  }
  if (resourceType === "categories" && !slug) {
    throw new ApiError(400, "MISSING_SLUG", "slug is required for category uploads");
  }

  const result = await storageService.uploadFile({
    fileBuffer: file.buffer,
    resourceId,
    resourceType: resourceType as storageService.ResourceType,
    fileType: fileType as storageService.FileType,
    mimeType: file.mimetype,
    slug: resourceType === "categories" ? slug : undefined,
  });

  res.json({ url: result.url, fileKey: result.fileKey });
});
