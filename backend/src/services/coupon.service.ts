import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

type DiscountType = "PERCENTAGE" | "FIXED";

type CouponInput = {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  minimumCartValue?: number;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  isStackable?: boolean;
};

type CouponUpdateInput = Partial<CouponInput>;

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

function assertDateRange(startDate?: Date, endDate?: Date) {
  if (startDate && endDate && startDate > endDate) {
    throw new ApiError(400, "INVALID_DATE_RANGE", "End date must be after start date");
  }
}

async function ensureUniqueCode(code: string, excludeId?: string) {
  const existing = await prisma.coupon.findFirst({
    where: {
      code,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existing) throw new ApiError(409, "COUPON_EXISTS", "Coupon code already exists");
}

export async function createCoupon(input: CouponInput) {
  assertDateRange(input.startDate, input.endDate);
  const normalized = normalizeCode(input.code);
  await ensureUniqueCode(normalized);

  return prisma.coupon.create({
    data: {
      code: normalized,
      description: input.description ?? null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive ?? true,
      minimumCartValue: input.minimumCartValue ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? null,
      isStackable: input.isStackable ?? false,
    },
  });
}

export async function updateCoupon(id: string, input: CouponUpdateInput) {
  assertDateRange(input.startDate, input.endDate);

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");

  let code = existing.code;
  if (input.code) {
    code = normalizeCode(input.code);
    await ensureUniqueCode(code, id);
  }

  return prisma.coupon.update({
    where: { id },
    data: {
      code,
      description: input.description ?? undefined,
      discountType: input.discountType ?? undefined,
      discountValue: input.discountValue ?? undefined,
      startDate: input.startDate ?? undefined,
      endDate: input.endDate ?? undefined,
      isActive: input.isActive ?? undefined,
      minimumCartValue: input.minimumCartValue ?? undefined,
      maxRedemptions: input.maxRedemptions ?? undefined,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? undefined,
      isStackable: input.isStackable ?? undefined,
    },
  });
}

export async function deleteCoupon(id: string) {
  try {
    await prisma.coupon.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }
}

export async function validateCouponForCart(cartId: string, code: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: { include: { variant: { select: { price: true } } } },
    },
  });
  if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");

  const normalized = normalizeCode(code);
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");

  const now = new Date();
  if (!coupon.isActive || coupon.startDate > now || coupon.endDate < now) {
    throw new ApiError(400, "COUPON_INACTIVE", "Coupon is not active");
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.variant?.price ?? 0) * item.quantity, 0);
  if (coupon.minimumCartValue != null && subtotal < coupon.minimumCartValue) {
    throw new ApiError(400, "COUPON_MINIMUM_NOT_MET", "Cart total does not meet minimum requirement");
  }

  if (coupon.maxRedemptions != null) {
    const total = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    if (total >= coupon.maxRedemptions) {
      throw new ApiError(400, "COUPON_LIMIT_REACHED", "Coupon redemption limit reached");
    }
  }

  if (coupon.maxRedemptionsPerUser != null) {
    if (!cart.userId) {
      throw new ApiError(400, "COUPON_REQUIRES_USER", "Coupon requires an authenticated user");
    }
    const perUser = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: cart.userId },
    });
    if (perUser >= coupon.maxRedemptionsPerUser) {
      throw new ApiError(400, "COUPON_USER_LIMIT_REACHED", "User redemption limit reached");
    }
  }

  return { coupon, subtotal };
}

export async function getCouponStats(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");

  const totalRedemptions = await prisma.couponRedemption.count({ where: { couponId: id } });
  const uniqueUsers = (
    await prisma.couponRedemption.findMany({
      where: { couponId: id, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    })
  ).length;
  const lastRedemption = await prisma.couponRedemption.findFirst({
    where: { couponId: id },
    orderBy: { redeemedAt: "desc" },
    select: { redeemedAt: true },
  });

  return {
    couponId: id,
    totalRedemptions,
    uniqueUsers,
    lastRedeemedAt: lastRedemption?.redeemedAt ?? null,
  };
}

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
  return coupon;
}
