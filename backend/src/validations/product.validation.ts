import { z } from "zod";

const variantAttributeSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.string().min(1).max(200),
});

const variantSchema = z.object({
  sku: z.string().min(1).max(100),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).default(0),
  isDefault: z.boolean().optional(),
  attributes: z.array(variantAttributeSchema).optional(),
});

export const createProductSchema = z.object({
  body: z.object({
    id: z.string().min(1),
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(["SIMPLE", "VARIABLE"]),
    imageUrl: z.string().url(),
    imageFileId: z.string().min(1),
    imageFilePath: z.string().min(1),
    imageFolderPath: z.string().min(1),
    thumbUrl: z.string().url().optional(),
    thumbFileId: z.string().min(1).optional(),
    thumbFilePath: z.string().min(1).optional(),
    gallery: z
      .array(
        z.object({
          index: z.number().int().min(1).max(20),
          url: z.string().url(),
          fileId: z.string().min(1),
          filePath: z.string().min(1),
        }),
      )
      .optional(),
    categoryId: z.string().min(1),
    variants: z.array(variantSchema).min(1),
  }),
});

const variantUpdateSchema = z.object({
  id: z.string().min(1).optional(), // If present, update existing; otherwise create new
  sku: z.string().min(1).max(100),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  isDefault: z.boolean().optional(),
  attributes: z.array(variantAttributeSchema).optional(),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    type: z.enum(["SIMPLE", "VARIABLE"]).optional(),
    imageUrl: z.string().url().optional(),
    imageFileId: z.string().min(1).optional(),
    imageFilePath: z.string().min(1).optional(),
    thumbUrl: z.string().url().optional(),
    thumbFileId: z.string().min(1).optional(),
    thumbFilePath: z.string().min(1).optional(),
    gallery: z
      .array(
        z.object({
          index: z.number().int().min(1).max(20),
          url: z.string().url(),
          fileId: z.string().min(1),
          filePath: z.string().min(1),
        }),
      )
      .optional(),
    deleteGalleryIndexes: z.array(z.number().int().min(1).max(20)).optional(),
    categoryId: z.string().min(1).optional(),
    variants: z.array(variantUpdateSchema).optional(),
    deleteVariantIds: z.array(z.string()).optional(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    categoryId: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});


