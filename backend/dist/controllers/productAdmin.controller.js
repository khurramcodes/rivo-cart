import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export const newProductId = asyncHandler(async (_req, res) => {
  const raw = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const year = String(now.getFullYear());
  const month = pad2(now.getMonth() + 1);

  const isProduction = process.env.NODE_ENV === "production";

  const baseFolder = isProduction ? "RivoCart" : "RivoCart-dev"; // or RivoCart-local if you prefer

  const imageFolderPath = `${baseFolder}/products/${year}/${month}/prod_${raw}`;

  res.json({ id: raw, imageFolderPath });
});
