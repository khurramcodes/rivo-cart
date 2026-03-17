import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as collectionService from "./collection.service.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { title, slug, description, isActive } = req.body as {
    title: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  };
  const collection = await collectionService.createCollection({ title, slug, description, isActive });
  res.status(201).json({ collection });
});

export const listAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await collectionService.getAllCollections();
  res.json({ collections });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const collection = await collectionService.getCollectionById(id);
  res.json({ collection });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { title, slug, description, isActive } = req.body as {
    title?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  };
  const collection = await collectionService.updateCollection(id, {
    title,
    slug,
    description,
    isActive,
  });
  res.json({ collection });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await collectionService.deleteCollection(id);
  res.status(204).send();
});

export const addProducts = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { productIds } = req.body as { productIds: string[] };
  const items = await collectionService.addProducts(id, productIds);
  res.status(201).json({ items });
});

export const reorderProducts = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { items } = req.body as {
    items: { productId: string; position: number }[];
  };
  const updated = await collectionService.reorderProducts(id, items);
  res.json({ items: updated });
});

export const removeProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id, productId } = req.params as { id: string; productId: string };
  const items = await collectionService.removeProduct(id, productId);
  res.json({ items });
});

export const listPublic = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await collectionService.getPublicCollections();
  res.json({ collections });
});

export const getPublicCollectionProducts = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const collection = (await collectionService.getCollectionBySlug(slug)) as any;
  res.json({
    collection: {
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      description: collection.description,
      isActive: collection.isActive,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    },
    products: collection.products.map((item: any) => ({
      position: item.position,
      product: item.product,
    })),
  });
});
