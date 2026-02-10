import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { resolveCartPricing } from "./pricing.service.js";
import { resolveShippingCost } from "./shippingCost.service.js";

export async function quoteShippingForUser(input: { userId: string; addressId: string }) {
  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId: input.userId },
  });
  if (!address) throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");

  const cart = await prisma.cart.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });
  if (!cart) {
    throw new ApiError(400, "CART_NOT_FOUND", "No active cart found");
  }

  const pricing = await resolveCartPricing(cart.id);
  const orderSubtotal = pricing.discountedPrice;
  const methods = await prisma.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const quotes = [];
  for (const method of methods) {
    const result = await resolveShippingCost({
      subtotal: orderSubtotal,
      address: { country: address.country, state: address.state, city: address.city },
      methodId: method.id,
    });
    if (!result) continue;
    quotes.push({
      method: result.shippingMethod,
      cost: result.shippingAmount,
      ruleId: result.appliedRuleId,
      zoneId: result.zoneId,
    });
  }

  return { quotes };
}

export async function resolveShippingForOrder(input: {
  userId: string;
  addressId: string;
  methodId?: string;
}) {
  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId: input.userId },
  });
  if (!address) throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");

  const cart = await prisma.cart.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
  });
  if (!cart) {
    return { shippingCost: 0, shippingMethodId: null };
  }

  const pricing = await resolveCartPricing(cart.id);
  const orderSubtotal = pricing.discountedPrice;

  if (input.methodId) {
    const result = await resolveShippingCost({
      subtotal: orderSubtotal,
      address: { country: address.country, state: address.state, city: address.city },
      methodId: input.methodId,
    });
    if (!result) {
      throw new ApiError(400, "SHIPPING_METHOD_NOT_AVAILABLE", "Selected shipping method is not available");
    }
    return { shippingCost: result.shippingAmount, shippingMethodId: result.shippingMethod.id };
  }

  const methods = await prisma.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  for (const method of methods) {
    const result = await resolveShippingCost({
      subtotal: orderSubtotal,
      address: { country: address.country, state: address.state, city: address.city },
      methodId: method.id,
    });
    if (result) {
      return { shippingCost: result.shippingAmount, shippingMethodId: result.shippingMethod.id };
    }
  }

  return { shippingCost: 0, shippingMethodId: null };
}
