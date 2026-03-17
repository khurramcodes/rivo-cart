import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { slugify } from "../../utils/slug.js";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const slugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const createCollectionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(220).optional(),
    description: z.string().trim().max(2000).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().min(1).max(220).optional(),
    description: z.string().trim().max(2000).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const collectionProductsBodySchema = z.object({
  body: z.object({
    productIds: z.array(z.string().min(1)).min(1),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const reorderCollectionProductsSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          position: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const removeCollectionProductSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    productId: z.string().min(1),
  }),
});

export function normalizeCollectionTitle(title: string) {
  const value = title.trim();
  if (!value) throw new ApiError(400, "INVALID_COLLECTION_TITLE", "Collection title is required");
  return value;
}

export function toCollectionSlug(title: string) {
  const value = slugify(title);
  if (!value) {
    throw new ApiError(
      400,
      "INVALID_COLLECTION_SLUG",
      "Collection title must include letters or numbers",
    );
  }
  return value;
}

export function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
