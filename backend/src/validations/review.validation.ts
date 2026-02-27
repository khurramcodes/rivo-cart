import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(2000),
  }),
});

export const updateReviewSchema = z.object({
  params: idParamSchema.shape.params,
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(2000),
  }),
});

export const listProductReviewsSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
  }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      sort: z.enum(["rating_desc", "newest"]).optional(),
    })
    .optional(),
});

export const topProductReviewsSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
  }),
});

export const adminListReviewsSchema = z.object({
  query: z
    .object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const markHelpfulSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isHelpful: z.boolean() }),
});

export const createReplySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ message: z.string().trim().min(1).max(2000) }),
});

export const updateReplySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ message: z.string().trim().min(1).max(2000) }),
});

export const myReviewSchema = z.object({
  query: z.object({
    productId: z.string().min(1),
  }),
});

