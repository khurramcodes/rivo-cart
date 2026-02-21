import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

type ReviewSort = "rating_desc" | "newest";

async function hasDeliveredOrderForProduct(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { productId } },
    },
    select: { id: true },
  });
  return Boolean(order);
}

export async function recalculateProductRatings(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const ratingCount = agg._count._all;
  const ratingAverage = ratingCount > 0 ? Number(agg._avg.rating ?? 0) : 0;
  const reviewCount = ratingCount;

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAverage,
      ratingCount,
      reviewCount,
    },
  });
}

export async function createReview(input: {
  userId: string;
  productId: string;
  rating: number;
  comment: string;
}) {
  const ok = await hasDeliveredOrderForProduct(input.userId, input.productId);
  if (!ok) {
    throw new ApiError(403, "REVIEW_NOT_ALLOWED", "Only delivered purchases can be reviewed");
  }

  try {
    return await prisma.review.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment.trim(),
        status: "PENDING",
        isVerifiedPurchase: true,
      },
    });
  } catch (err: any) {
    // Unique constraint: one review per user per product
    if (err?.code === "P2002") {
      throw new ApiError(409, "REVIEW_EXISTS", "You already reviewed this product");
    }
    throw err;
  }
}

export async function updateReview(input: {
  userId: string;
  reviewId: string;
  rating: number;
  comment: string;
}) {
  const existing = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, userId: true, productId: true, status: true },
  });
  if (!existing) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
  if (existing.userId !== input.userId) throw new ApiError(403, "FORBIDDEN", "Not your review");

  const wasApproved = existing.status === "APPROVED";

  const updated = await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      rating: input.rating,
      comment: input.comment.trim(),
      status: "PENDING",
      approvedAt: null,
      approvedBy: null,
    },
  });

  if (wasApproved) {
    await recalculateProductRatings(existing.productId);
  }

  return updated;
}

export async function listApprovedReviewsForProduct(input: {
  productId: string;
  page?: number;
  limit?: number;
  sort?: ReviewSort;
}) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, Math.max(1, input.limit ?? 10));
  const skip = (page - 1) * limit;

  const orderBy =
    input.sort === "rating_desc"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { productId: input.productId, status: "APPROVED" },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.review.count({ where: { productId: input.productId, status: "APPROVED" } }),
  ]);

  return { items, total, page, limit };
}

export async function listTopApprovedReviews(input: { productId: string }) {
  return prisma.review.findMany({
    where: { productId: input.productId, status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 3,
  });
}

export async function adminListReviews(input: { status?: "PENDING" | "APPROVED" | "REJECTED"; page?: number; limit?: number }) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, Math.max(1, input.limit ?? 20));
  const skip = (page - 1) * limit;
  const status = input.status ?? "PENDING";

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { status },
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip,
    }),
    prisma.review.count({ where: { status } }),
  ]);

  return { items, total, page, limit };
}

export async function adminApproveReview(input: { reviewId: string; approvedBy: string }) {
  const existing = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, productId: true, status: true },
  });
  if (!existing) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");

  await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: input.approvedBy,
    },
  });

  await recalculateProductRatings(existing.productId);
}

export async function adminRejectReview(input: { reviewId: string; approvedBy: string }) {
  const existing = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, productId: true, status: true },
  });
  if (!existing) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");

  const wasApproved = existing.status === "APPROVED";

  await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      status: "REJECTED",
      approvedAt: null,
      approvedBy: input.approvedBy,
    },
  });

  if (wasApproved) {
    await recalculateProductRatings(existing.productId);
  }
}

export async function getMyReviewForProduct(input: { userId: string; productId: string }) {
  return prisma.review.findUnique({
    where: {
      productId_userId: {
        productId: input.productId,
        userId: input.userId,
      },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

