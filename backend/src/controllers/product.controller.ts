import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { q, categoryId, page, limit, sortBy, sortDir, minPrice, maxPrice } = req.query as {
    q?: string;
    categoryId?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortDir?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  const result = await productService.listProducts({
    q,
    categoryId,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as "name" | "category" | "price" | "stock" | "type" | "createdAt" | undefined,
    sortDir: sortDir as "asc" | "desc" | undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });
  res.json(result);
});

export const latest = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 6;
  const items = await productService.listLatestProducts(limit);

  res.json({ items });
});

export const bestSelling = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const items = await productService.listBestSellingProducts(limit);
  res.json({ items });
});


export const get = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const product = await productService.getProduct(id);
  res.json({ product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const {
    id,
    name,
    description,
    type,
    imageUrl,
    imageFileId,
    imageFilePath,
    imageFolderPath,
    thumbUrl,
    thumbFileId,
    thumbFilePath,
    gallery,
    categoryId,
    highlights,
    variants,
  } = req.body as {
    id: string;
    name: string;
    description?: string;
    type: "SIMPLE" | "VARIABLE";
    imageUrl: string;
    imageFileId: string;
    imageFilePath: string;
    imageFolderPath: string;
    thumbUrl?: string;
    thumbFileId?: string;
    thumbFilePath?: string;
    gallery?: { index: number; url: string; fileId: string; filePath: string }[];
    categoryId: string;
    highlights?: { text: string; sortOrder?: number }[];
    variants: {
      sku: string;
      price: number;
      stock: number;
      isDefault?: boolean;
      attributes?: { name: string; value: string }[];
    }[];
  };
  const product = await productService.createProduct({
    id,
    name,
    description,
    type,
    imageUrl,
    imageFileId,
    imageFilePath,
    imageFolderPath,
    thumbUrl,
    thumbFileId,
    thumbFilePath,
    gallery,
    categoryId,
    highlights,
    variants,
  });
  res.status(201).json({ product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const {
    name,
    description,
    type,
    imageUrl,
    imageFileId,
    imageFilePath,
    thumbUrl,
    thumbFileId,
    thumbFilePath,
    gallery,
    deleteGalleryIndexes,
    categoryId,
    highlights,
    variants,
    deleteVariantIds,
  } = req.body as {
    name?: string;
    description?: string;
    type?: "SIMPLE" | "VARIABLE";
    imageUrl?: string;
    imageFileId?: string;
    imageFilePath?: string;
    thumbUrl?: string;
    thumbFileId?: string;
    thumbFilePath?: string;
    gallery?: { index: number; url: string; fileId: string; filePath: string }[];
    deleteGalleryIndexes?: number[];
    categoryId?: string;
    highlights?: { text: string; sortOrder?: number }[];
    variants?: {
      id?: string;
      sku: string;
      price: number;
      stock: number;
      isDefault?: boolean;
      attributes?: { name: string; value: string }[];
    }[];
    deleteVariantIds?: string[];
  };
  const product = await productService.updateProduct(id, {
    name,
    description,
    type,
    imageUrl,
    imageFileId,
    imageFilePath,
    thumbUrl,
    thumbFileId,
    thumbFilePath,
    gallery,
    deleteGalleryIndexes,
    categoryId,
    highlights,
    variants,
    deleteVariantIds,
  });
  res.json({ product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await productService.deleteProduct(id);
  res.status(204).send();
});


