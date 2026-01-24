import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as discountService from "../services/discount.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const discounts = await discountService.listDiscounts();
  res.json({ discounts });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const discount = await discountService.getDiscount(id);
  res.json({ discount });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const discount = await discountService.createDiscount(req.body);
  res.status(201).json({ discount });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const discount = await discountService.updateDiscount(id, req.body);
  res.json({ discount });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await discountService.deleteDiscount(id);
  res.status(204).send();
});
