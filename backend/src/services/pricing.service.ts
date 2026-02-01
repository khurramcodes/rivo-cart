import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

type AppliedDiscount = {
  id: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  scope: "SITE_WIDE" | "PRODUCT" | "VARIANT" | "CATEGORY" | "COLLECTION";
  priority: number;
  isStackable: boolean;
  amount: number;
};

type AppliedCoupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  amount: number;
};

export type PricingLineItem = {
  itemId: string;
  originalUnitPrice: number;
  discountedUnitPrice: number;
  quantity: number;
  lineTotal: number;
};

type PricingResult = {
  originalPrice: number;
  discountedPrice: number;
  lineItems: PricingLineItem[];
  appliedDiscounts: AppliedDiscount[];
  appliedCoupon: AppliedCoupon | null;
  totalSavings: number;
};

const discountOrderBy = [{ priority: "desc" as const }, { createdAt: "desc" as const }];

function applyDiscountAmount(current: number, discountType: "PERCENTAGE" | "FIXED", discountValue: number) {
  if (discountType === "PERCENTAGE") {
    return Math.round((current * discountValue) / 100);
  }
  return discountValue;
}

function applyDiscounts(
  currentPrice: number,
  discounts: {
    id: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    scope: "SITE_WIDE" | "PRODUCT" | "VARIANT" | "CATEGORY" | "COLLECTION";
    priority: number;
    isStackable: boolean;
  }[],
  applied: AppliedDiscount[],
  locked: boolean,
) {
  let price = currentPrice;
  let stop = locked;

  for (const discount of discounts) {
    if (stop) break;
    const amount = applyDiscountAmount(price, discount.discountType, discount.discountValue);
    if (amount <= 0) continue;

    price = Math.max(0, price - amount);
    applied.push({ ...discount, amount });
    if (!discount.isStackable) {
      stop = true;
    }
  }

  return { price, locked: stop };
}

async function getCategoryChainIds(categoryId: string, cache: Map<string, string[]>) {
  const cached = cache.get(categoryId);
  if (cached) return cached;

  const chain: string[] = [];
  let currentId: string | null = categoryId;
  while (currentId) {
    const category: { id: string; parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, parentId: true },
      });
    if (!category) break;
    chain.unshift(category.id);
    currentId = category.parentId ?? null;
  }

  cache.set(categoryId, chain);
  return chain;
}

async function getVariantDiscounts(variantId: string, now: Date, cache: Map<string, any[]>) {
  const key = `variant:${variantId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const discounts = await prisma.discount.findMany({
    where: {
      scope: "VARIANT",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      variants: { some: { variantId } },
    },
    orderBy: discountOrderBy,
  });
  cache.set(key, discounts);
  return discounts;
}

async function getProductDiscounts(productId: string, now: Date, cache: Map<string, any[]>) {
  const key = `product:${productId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const discounts = await prisma.discount.findMany({
    where: {
      scope: "PRODUCT",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      products: { some: { productId } },
    },
    orderBy: discountOrderBy,
  });
  cache.set(key, discounts);
  return discounts;
}

async function getCategoryDiscounts(categoryId: string, now: Date, cache: Map<string, any[]>) {
  const key = `category:${categoryId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const discounts = await prisma.discount.findMany({
    where: {
      scope: "CATEGORY",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      categories: { some: { categoryId } },
    },
    orderBy: discountOrderBy,
  });
  cache.set(key, discounts);
  return discounts;
}

async function getCollectionDiscounts(collectionId: string, now: Date, cache: Map<string, any[]>) {
  const key = `collection:${collectionId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const discounts = await prisma.discount.findMany({
    where: {
      scope: "COLLECTION",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      collections: { some: { collectionId } },
    },
    orderBy: discountOrderBy,
  });
  cache.set(key, discounts);
  return discounts;
}

async function getSiteWideDiscounts(now: Date, cache: Map<string, any[]>) {
  const key = "site";
  const cached = cache.get(key);
  if (cached) return cached;
  const discounts = await prisma.discount.findMany({
    where: {
      scope: "SITE_WIDE",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: discountOrderBy,
  });
  cache.set(key, discounts);
  return discounts;
}

type DiscountCache = {
  categoryChain: Map<string, string[]>;
  discounts: Map<string, any[]>;
};

async function computeVariantDiscounts(
  variantId: string,
  productId: string,
  categoryId: string,
  collectionIds: string[],
  basePrice: number,
  now: Date,
  cache: DiscountCache,
) {
  const applied: AppliedDiscount[] = [];
  let price = basePrice;
  let locked = false;

  const variantDiscounts = await getVariantDiscounts(variantId, now, cache.discounts);
  let state = applyDiscounts(price, variantDiscounts, applied, locked);
  price = state.price;
  locked = state.locked;

  const productDiscounts = await getProductDiscounts(productId, now, cache.discounts);
  state = applyDiscounts(price, productDiscounts, applied, locked);
  price = state.price;
  locked = state.locked;

  const categoryChain = await getCategoryChainIds(categoryId, cache.categoryChain);
  for (const id of categoryChain) {
    const categoryDiscounts = await getCategoryDiscounts(id, now, cache.discounts);
    state = applyDiscounts(price, categoryDiscounts, applied, locked);
    price = state.price;
    locked = state.locked;
  }

  for (const id of collectionIds) {
    const collectionDiscounts = await getCollectionDiscounts(id, now, cache.discounts);
    state = applyDiscounts(price, collectionDiscounts, applied, locked);
    price = state.price;
    locked = state.locked;
  }

  const siteWideDiscounts = await getSiteWideDiscounts(now, cache.discounts);
  state = applyDiscounts(price, siteWideDiscounts, applied, locked);
  price = state.price;

  return { price, applied };
}

export async function resolveVariantPricing(variantId: string): Promise<PricingResult> {
  const now = new Date();
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { id: true, categoryId: true } } },
  });

  if (!variant || !variant.product) {
    throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }

  const cache: DiscountCache = {
    categoryChain: new Map(),
    discounts: new Map(),
  };

  const originalPrice = variant.price;

  const pricing = await computeVariantDiscounts(
    variant.id,
    variant.productId,
    variant.product.categoryId,
    [],
    originalPrice,
    now,
    cache,
  );

  const discountedPrice = pricing.price;

  return {
    originalPrice,
    discountedPrice,
    lineItems: [],
    appliedDiscounts: pricing.applied,
    appliedCoupon: null,
    totalSavings: Math.max(0, originalPrice - discountedPrice),
  };
}

export async function resolveCartPricing(cartId: string): Promise<PricingResult> {
  const now = new Date();
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: { select: { id: true, price: true, productId: true } },
          product: { select: { categoryId: true } },
        },
      },
    },
  });

  if (!cart) {
    throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
  }

  const cache: DiscountCache = {
    categoryChain: new Map(),
    discounts: new Map(),
  };

  let originalPrice = 0;
  let discountedPrice = 0;
  const appliedDiscounts: AppliedDiscount[] = [];
  const lineItems: PricingLineItem[] = [];

  for (const item of cart.items) {
    if (!item.variant || !item.product) continue;
    const originalUnitPrice = item.variant.price;
    const lineOriginal = originalUnitPrice * item.quantity;
    originalPrice += lineOriginal;

    const pricing = await computeVariantDiscounts(
      item.variant.id,
      item.variant.productId,
      item.product.categoryId,
      [],
      item.variant.price,
      now,
      cache,
    );

    const discountedUnitPrice = pricing.price;
    const lineTotal = discountedUnitPrice * item.quantity;
    discountedPrice += lineTotal;
    appliedDiscounts.push(...pricing.applied);
    lineItems.push({
      itemId: item.id,
      originalUnitPrice,
      discountedUnitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const appliedById = new Map(appliedDiscounts.map((d) => [d.id, d]));
  const uniqueApplied = Array.from(appliedById.values());

  let appliedCoupon: AppliedCoupon | null = null;

  if (cart.appliedCouponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: cart.appliedCouponId },
    });

    if (coupon) {
      const isActive =
        coupon.isActive && coupon.startDate <= now && coupon.endDate >= now &&
        (coupon.minimumCartValue == null || discountedPrice >= coupon.minimumCartValue);

      let withinLimits = true;
      if (coupon.maxRedemptions != null) {
        const total = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
        withinLimits = total < coupon.maxRedemptions;
      }

      if (withinLimits && coupon.maxRedemptionsPerUser != null) {
        if (!cart.userId) {
          withinLimits = false;
        } else {
          const perUser = await prisma.couponRedemption.count({
            where: { couponId: coupon.id, userId: cart.userId },
          });
          withinLimits = perUser < coupon.maxRedemptionsPerUser;
        }
      }

      const canStack =
        uniqueApplied.length === 0 ||
        (coupon.isStackable && uniqueApplied.every((d) => d.isStackable));

      if (isActive && withinLimits && canStack) {
        const amount = applyDiscountAmount(discountedPrice, coupon.discountType, coupon.discountValue);
        if (amount > 0) {
          discountedPrice = Math.max(0, discountedPrice - amount);
          appliedCoupon = {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            amount,
          };
        }
      }
    }
  }

  return {
    originalPrice,
    discountedPrice,
    lineItems,
    appliedDiscounts: uniqueApplied,
    appliedCoupon,
    totalSavings: Math.max(0, originalPrice - discountedPrice),
  };
}
