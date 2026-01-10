import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { q, categoryId, page, limit } = req.query as {
    q?: string;
    categoryId?: string;
    page?: string;
    limit?: string;
  };
  const result = await productService.listProducts({
    q,
    categoryId,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
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


