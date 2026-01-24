import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

type DiscountScope =
  | "SITE_WIDE"
  | "PRODUCT"
  | "VARIANT"
  | "CATEGORY"
  | "COLLECTION";
type DiscountType = "PERCENTAGE" | "FIXED";

type DiscountInput = {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  priority?: number;
  isStackable?: boolean;
  scope: DiscountScope;
  productIds?: string[];
  variantIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
};

type DiscountUpdateInput = Partial<DiscountInput>;

function assertDateRange(startDate?: Date, endDate?: Date) {
  if (startDate && endDate && startDate > endDate) {
    throw new ApiError(
      400,
      "INVALID_DATE_RANGE",
      "End date must be after start date",
    );
  }
}

function assertScopeAssignments(
  scope: DiscountScope,
  input: DiscountInput | DiscountUpdateInput,
) {
  const productIds = input.productIds ?? [];
  const variantIds = input.variantIds ?? [];
  const categoryIds = input.categoryIds ?? [];
  const collectionIds = input.collectionIds ?? [];

  const hasAny =
    productIds.length > 0 ||
    variantIds.length > 0 ||
    categoryIds.length > 0 ||
    collectionIds.length > 0;

  switch (scope) {
    case "SITE_WIDE":
      if (hasAny)
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Site-wide discounts cannot be assigned",
        );
      break;
    case "PRODUCT":
      if (productIds.length === 0) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Product discounts require productIds",
        );
      }
      if (variantIds.length || categoryIds.length || collectionIds.length) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Product discounts can only target products",
        );
      }
      break;
    case "VARIANT":
      if (variantIds.length === 0) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Variant discounts require variantIds",
        );
      }
      if (productIds.length || categoryIds.length || collectionIds.length) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Variant discounts can only target variants",
        );
      }
      break;
    case "CATEGORY":
      if (categoryIds.length === 0) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Category discounts require categoryIds",
        );
      }
      if (productIds.length || variantIds.length || collectionIds.length) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Category discounts can only target categories",
        );
      }
      break;
    case "COLLECTION":
      if (collectionIds.length === 0) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Collection discounts require collectionIds",
        );
      }
      if (productIds.length || variantIds.length || categoryIds.length) {
        throw new ApiError(
          400,
          "INVALID_SCOPE_ASSIGNMENT",
          "Collection discounts can only target collections",
        );
      }
      break;
    default:
      throw new ApiError(400, "INVALID_SCOPE", "Invalid discount scope");
  }
}

async function resetAssignments(
  tx: Prisma.TransactionClient,
  discountId: string,
) {
  await Promise.all([
    tx.discountProducts.deleteMany({ where: { discountId } }),
    tx.discountVariants.deleteMany({ where: { discountId } }),
    tx.discountCategories.deleteMany({ where: { discountId } }),
    tx.discountCollections.deleteMany({ where: { discountId } }),
  ]);
}

async function assignScopeTargets(
  tx: Prisma.TransactionClient,
  discountId: string,
  input: DiscountInput,
) {
  if (input.scope === "PRODUCT") {
    await tx.discountProducts.createMany({
      data: input.productIds!.map((productId) => ({ discountId, productId })),
      skipDuplicates: true,
    });
  }
  if (input.scope === "VARIANT") {
    await tx.discountVariants.createMany({
      data: input.variantIds!.map((variantId) => ({ discountId, variantId })),
      skipDuplicates: true,
    });
  }
  if (input.scope === "CATEGORY") {
    await tx.discountCategories.createMany({
      data: input.categoryIds!.map((categoryId) => ({
        discountId,
        categoryId,
      })),
      skipDuplicates: true,
    });
  }
  if (input.scope === "COLLECTION") {
    await tx.discountCollections.createMany({
      data: input.collectionIds!.map((collectionId) => ({
        discountId,
        collectionId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function createDiscount(input: DiscountInput) {
  assertDateRange(input.startDate, input.endDate);
  assertScopeAssignments(input.scope, input);

  return prisma.$transaction(async (tx) => {
    const discount = await tx.discount.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive ?? true,
        priority: input.priority ?? 0,
        isStackable: input.isStackable ?? false,
        scope: input.scope,
      },
    });

    await assignScopeTargets(tx, discount.id, input);
    return discount;
  });
}

export async function updateDiscount(id: string, input: DiscountUpdateInput) {
  assertDateRange(input.startDate, input.endDate);

  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing)
    throw new ApiError(404, "DISCOUNT_NOT_FOUND", "Discount not found");

  const scope = input.scope ?? existing.scope;
  const hasAssignments =
    input.productIds !== undefined ||
    input.variantIds !== undefined ||
    input.categoryIds !== undefined ||
    input.collectionIds !== undefined ||
    input.scope !== undefined;

  if (hasAssignments) {
    assertScopeAssignments(scope, {
      ...existing,
      description: existing.description ?? undefined,
      ...input,
      scope,
      productIds: input.productIds ?? [],
      variantIds: input.variantIds ?? [],
      categoryIds: input.categoryIds ?? [],
      collectionIds: input.collectionIds ?? [],
    });
  }

  return prisma.$transaction(async (tx) => {
    const discount = await tx.discount.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        discountType: input.discountType ?? undefined,
        discountValue: input.discountValue ?? undefined,
        startDate: input.startDate ?? undefined,
        endDate: input.endDate ?? undefined,
        isActive: input.isActive ?? undefined,
        priority: input.priority ?? undefined,
        isStackable: input.isStackable ?? undefined,
        scope: input.scope ?? undefined,
      },
    });

    if (hasAssignments) {
      await resetAssignments(tx, id);
      await assignScopeTargets(tx, discount.id, {
        name: discount.name,
        description: discount.description ?? undefined,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        startDate: discount.startDate,
        endDate: discount.endDate,
        isActive: discount.isActive,
        priority: discount.priority,
        isStackable: discount.isStackable,
        scope,
        productIds: input.productIds ?? [],
        variantIds: input.variantIds ?? [],
        categoryIds: input.categoryIds ?? [],
        collectionIds: input.collectionIds ?? [],
      });
    }

    return discount;
  });
}

export async function deleteDiscount(id: string) {
  try {
    await prisma.discount.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "DISCOUNT_NOT_FOUND", "Discount not found");
  }
}

export async function listDiscounts() {
  return prisma.discount.findMany({
    include: {
      products: { select: { productId: true } },
      variants: { select: { variantId: true } },
      categories: { select: { categoryId: true } },
      collections: { select: { collectionId: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getDiscount(id: string) {
  const discount = await prisma.discount.findUnique({
    where: { id },
    include: {
      products: { select: { productId: true } },
      variants: { select: { variantId: true } },
      categories: { select: { categoryId: true } },
      collections: { select: { collectionId: true } },
    },
  });
  if (!discount)
    throw new ApiError(404, "DISCOUNT_NOT_FOUND", "Discount not found");
  return discount;
}
