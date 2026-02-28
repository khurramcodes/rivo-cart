import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export const imageFolder = asyncHandler(async (req: Request, res: Response) => {
  const slug = (req.query.slug as string)?.trim();
  if (!slug) {
    res.status(400).json({ error: { message: "slug query param required" } });
    return;
  }
  const now = new Date();
  const year = String(now.getFullYear());
  const month = pad2(now.getMonth() + 1);
  const isProduction = process.env.NODE_ENV === "production";
  const baseFolder = isProduction
    ? (process.env.PRODUCT_IMAGE_FOLDER_BASE_PROD ?? "RivoCart")
    : (process.env.PRODUCT_IMAGE_FOLDER_BASE_DEV ?? "RivoCart-dev");
  const imageFolderPath = `${baseFolder}/categories/${year}/${month}`;
  res.json({ imageFolderPath, slug });
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.json({ categories });
});

export const bestSelling = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const items = await categoryService.listBestSellingCategories(limit);
  res.json({ items });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const category = await categoryService.getCategoryBySlug(slug);
  res.json({ category });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, parentId, imageUrl, imageFileId, imageFilePath, imageFolderPath } = req.body as {
    name: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
    imageFileId?: string;
    imageFilePath?: string;
    imageFolderPath?: string;
  };
  const category = await categoryService.createCategory({
    name,
    description,
    parentId,
    imageUrl,
    imageFileId,
    imageFilePath,
    imageFolderPath,
  });
  res.status(201).json({ category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const {
    name,
    description,
    parentId,
    imageUrl,
    imageFileId,
    imageFilePath,
    imageFolderPath,
  } = req.body as {
    name?: string;
    description?: string;
    parentId?: string;
    imageUrl?: string | null;
    imageFileId?: string | null;
    imageFilePath?: string | null;
    imageFolderPath?: string | null;
  };
  const category = await categoryService.updateCategory(id, {
    name,
    description,
    parentId,
    imageUrl,
    imageFileId,
    imageFilePath,
    imageFolderPath,
  });
  res.json({ category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await categoryService.deleteCategory(id);
  res.status(204).send();
});


