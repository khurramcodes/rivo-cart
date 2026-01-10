import type { Request, Response } from "express";
import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export const newProductId = asyncHandler(async (_req: Request, res: Response) => {
  const raw = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const year = String(now.getFullYear());
  const month = pad2(now.getMonth() + 1);
  const imageFolderPath = `RivoCart/products/${year}/${month}/prod_${raw}`;
  res.json({ id: raw, imageFolderPath });
});


