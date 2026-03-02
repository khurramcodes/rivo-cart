import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";

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
  const { id, name, description, parentId, imageUrl, imageFileKey } = req.body as {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    imageUrl?: string;
    imageFileKey?: string;
  };
  const category = await categoryService.createCategory({
    id,
    name,
    description,
    parentId,
    imageUrl,
    imageFileKey,
  });
  res.status(201).json({ category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description, parentId, imageUrl, imageFileKey } = req.body as {
    name?: string;
    description?: string;
    parentId?: string;
    imageUrl?: string | null;
    imageFileKey?: string | null;
  };
  const category = await categoryService.updateCategory(id, {
    name,
    description,
    parentId,
    imageUrl,
    imageFileKey,
  });
  res.json({ category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await categoryService.deleteCategory(id);
  res.status(204).send();
});


