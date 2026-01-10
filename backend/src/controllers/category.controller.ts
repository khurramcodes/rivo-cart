import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.json({ categories });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  const category = await categoryService.createCategory({ name, description });
  res.status(201).json({ category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description } = req.body as { name?: string; description?: string };
  const category = await categoryService.updateCategory(id, { name, description });
  res.json({ category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await categoryService.deleteCategory(id);
  res.status(204).send();
});


