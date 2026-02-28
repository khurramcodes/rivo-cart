import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    parentId: z.string().min(1).nullable().optional(),
    imageUrl: z.string().url().optional(),
    imageFileId: z.string().optional(),
    imageFilePath: z.string().optional(),
    imageFolderPath: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    parentId: z.string().min(1).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    imageFileId: z.string().nullable().optional(),
    imageFilePath: z.string().nullable().optional(),
    imageFolderPath: z.string().nullable().optional(),
  }),
});

export const categoryImageFolderSchema = z.object({
  query: z.object({
    slug: z.string().min(1),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});


