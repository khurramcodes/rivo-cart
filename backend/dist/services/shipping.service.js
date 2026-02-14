import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { resolveCartPricing } from "./pricing.service.js";
import { resolveShippingCost } from "./shippingCost.service.js";
async function resolveBestMethodCost(input) {
    const results = await Promise.all(input.methodIds.map((methodId) => resolveShippingCost({
        subtotal: input.subtotal,
        address: input.address,
        methodId,
    })));
    const available = results.filter((r) => Boolean(r));
    if (available.length === 0)
        return null;
    // Prefer the cheapest shipping amount (free shipping will naturally win)
    available.sort((a, b) => a.shippingAmount - b.shippingAmount);
    return available[0];
}
/**
 * Base shipping is mutually exclusive:
 * - If any FREE method matches the criteria, use it
 * - Otherwise fall back to STANDARD if available
 */
async function resolveBaseShipping(input) {
    const methods = await prisma.shippingMethod.findMany({
        where: { isActive: true, type: { in: ["FREE", "STANDARD"] } },
        select: { id: true, type: true },
        orderBy: { createdAt: "desc" },
    });
    const freeIds = methods.filter((m) => m.type === "FREE").map((m) => m.id);
    const standardIds = methods.filter((m) => m.type === "STANDARD").map((m) => m.id);
    const free = freeIds.length
        ? await resolveBestMethodCost({ subtotal: input.subtotal, address: input.address, methodIds: freeIds })
        : null;
    if (free)
        return free;
    const standard = standardIds.length
        ? await resolveBestMethodCost({ subtotal: input.subtotal, address: input.address, methodIds: standardIds })
        : null;
    return standard;
}
export async function quoteShippingForUser(input) {
    const address = await prisma.address.findFirst({
        where: { id: input.addressId, userId: input.userId },
    });
    if (!address)
        throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    const cart = await prisma.cart.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
    });
    if (!cart) {
        throw new ApiError(400, "CART_NOT_FOUND", "No active cart found");
    }
    const pricing = await resolveCartPricing(cart.id);
    const orderSubtotal = pricing.discountedPrice;
    const addr = { country: address.country, state: address.state, city: address.city };
    const base = await resolveBaseShipping({ subtotal: orderSubtotal, address: addr });
    const baseCost = base?.shippingAmount ?? 0;
    const quotes = [];
    // Only one base option should be shown: FREE (if eligible) otherwise STANDARD
    if (base) {
        quotes.push({
            method: base.shippingMethod,
            cost: base.shippingAmount,
            ruleId: base.appliedRuleId,
            zoneId: base.zoneId,
        });
    }
    // Express methods are "upgrade" options: their rule cost is treated as an additional charge.
    const expressMethods = await prisma.shippingMethod.findMany({
        where: { isActive: true, type: "EXPRESS" },
        select: { id: true },
        orderBy: { createdAt: "desc" },
    });
    for (const method of expressMethods) {
        const express = await resolveShippingCost({
            subtotal: orderSubtotal,
            address: addr,
            methodId: method.id,
        });
        if (!express)
            continue;
        quotes.push({
            method: express.shippingMethod,
            cost: baseCost + express.shippingAmount,
            ruleId: express.appliedRuleId,
            zoneId: express.zoneId,
        });
    }
    return { quotes };
}
export async function resolveShippingForOrder(input) {
    const address = await prisma.address.findFirst({
        where: { id: input.addressId, userId: input.userId },
    });
    if (!address)
        throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    const cart = await prisma.cart.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
    });
    if (!cart) {
        return { shippingCost: 0, shippingMethodId: null };
    }
    const pricing = await resolveCartPricing(cart.id);
    const orderSubtotal = pricing.discountedPrice;
    const addr = { country: address.country, state: address.state, city: address.city };
    if (input.methodId) {
        const selected = await prisma.shippingMethod.findUnique({
            where: { id: input.methodId },
            select: { id: true, type: true, isActive: true },
        });
        if (!selected || !selected.isActive) {
            throw new ApiError(400, "SHIPPING_METHOD_NOT_AVAILABLE", "Selected shipping method is not available");
        }
        // EXPRESS is an upgrade on top of the base shipping (FREE/STANDARD)
        if (selected.type === "EXPRESS") {
            const base = await resolveBaseShipping({ subtotal: orderSubtotal, address: addr });
            const baseCost = base?.shippingAmount ?? 0;
            const express = await resolveShippingCost({
                subtotal: orderSubtotal,
                address: addr,
                methodId: input.methodId,
            });
            if (!express) {
                throw new ApiError(400, "SHIPPING_METHOD_NOT_AVAILABLE", "Selected shipping method is not available");
            }
            return { shippingCost: baseCost + express.shippingAmount, shippingMethodId: express.shippingMethod.id };
        }
        const result = await resolveShippingCost({
            subtotal: orderSubtotal,
            address: addr,
            methodId: input.methodId,
        });
        if (!result) {
            throw new ApiError(400, "SHIPPING_METHOD_NOT_AVAILABLE", "Selected shipping method is not available");
        }
        return { shippingCost: result.shippingAmount, shippingMethodId: result.shippingMethod.id };
    }
    const base = await resolveBaseShipping({ subtotal: orderSubtotal, address: addr });
    if (base) {
        return { shippingCost: base.shippingAmount, shippingMethodId: base.shippingMethod.id };
    }
    return { shippingCost: 0, shippingMethodId: null };
}
