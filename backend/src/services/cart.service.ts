import { randomUUID } from "crypto";
import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
      variant: { include: { attributes: true } },
    },
  },
} as const;

type CartContext = {
  cart: Awaited<ReturnType<typeof prisma.cart.create>>;
  newSessionId?: string;
  clearSessionCookie?: boolean;
};

async function mergeCarts(userCartId: string, sessionCartId: string) {
  const sessionItems = await prisma.cartItem.findMany({
    where: { cartId: sessionCartId },
  });
  if (sessionItems.length === 0) {
    await prisma.cart.delete({ where: { id: sessionCartId } });
    return;
  }

  const variantIds = Array.from(new Set(sessionItems.map((i) => i.variantId)));
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  await prisma.$transaction(async (tx) => {
    for (const item of sessionItems) {
      const variant = variantById.get(item.variantId);
      if (!variant) continue;
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCartId, variantId: item.variantId } },
      });
      const desiredQty = (existing?.quantity ?? 0) + item.quantity;
      const nextQty = Math.max(1, Math.min(variant.stock, desiredQty));

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: nextQty, priceSnapshot: variant.price },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCartId,
            productId: variant.productId,
            variantId: variant.id,
            quantity: nextQty,
            priceSnapshot: variant.price,
          },
        });
      }
    }

    await tx.cart.delete({ where: { id: sessionCartId } });
  });
}

export async function resolveCart(userId?: string, sessionId?: string): Promise<CartContext> {
  if (userId) {
    const sessionCart = sessionId
      ? await prisma.cart.findUnique({
          where: { sessionId },
          include: cartInclude,
        })
      : null;

    const userCart = await prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: cartInclude,
    });

    if (sessionCart) {
      if (!userCart) {
        const cart = await prisma.cart.update({
          where: { id: sessionCart.id },
          data: { userId, sessionId: null },
          include: cartInclude,
        });
        return { cart, clearSessionCookie: true };
      }

      if (userCart.id !== sessionCart.id) {
        await mergeCarts(userCart.id, sessionCart.id);
      } else if (userCart.sessionId) {
        await prisma.cart.update({ where: { id: userCart.id }, data: { sessionId: null } });
      }

      const cart = await prisma.cart.findUnique({ where: { id: userCart.id }, include: cartInclude });
      if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
      return { cart, clearSessionCookie: true };
    }

    if (userCart) return { cart: userCart };

    const cart = await prisma.cart.create({ data: { userId }, include: cartInclude });
    return { cart };
  }

  if (sessionId) {
    const cart = await prisma.cart.findUnique({ where: { sessionId }, include: cartInclude });
    if (cart) return { cart };
  }

  const cart = await prisma.cart.create({
    data: { sessionId: randomUUID() },
    include: cartInclude,
  });
  return { cart, newSessionId: cart.sessionId ?? undefined };
}

async function getVariantForCart(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || variant.productId !== productId) {
    throw new ApiError(400, "INVALID_VARIANT", "Invalid product variant");
  }
  return variant;
}

export async function addItemToCart(
  userId: string | undefined,
  sessionId: string | undefined,
  input: { productId: string; variantId: string; quantity: number },
): Promise<CartContext> {
  const context = await resolveCart(userId, sessionId);
  const variant = await getVariantForCart(input.productId, input.variantId);

  const nextQty = input.quantity;
  if (variant.stock < nextQty) {
    throw new ApiError(400, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: context.cart.id, variantId: input.variantId } },
  });

  if (existing) {
    const combinedQty = existing.quantity + input.quantity;
    if (variant.stock < combinedQty) {
      throw new ApiError(400, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: combinedQty, priceSnapshot: variant.price },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: context.cart.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        priceSnapshot: variant.price,
      },
    });
  }

  const cart = await prisma.cart.findUnique({ where: { id: context.cart.id }, include: cartInclude });
  if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
  return { ...context, cart };
}

export async function updateCartItemQuantity(
  userId: string | undefined,
  sessionId: string | undefined,
  itemId: string,
  quantity: number,
): Promise<CartContext> {
  const context = await resolveCart(userId, sessionId);
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });
  if (!item || item.cartId !== context.cart.id) {
    throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) throw new ApiError(400, "INVALID_VARIANT", "Invalid product variant");
    if (variant.stock < quantity) {
      throw new ApiError(400, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
    }
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity, priceSnapshot: variant.price },
    });
  }

  const cart = await prisma.cart.findUnique({ where: { id: context.cart.id }, include: cartInclude });
  if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
  return { ...context, cart };
}

export async function removeCartItem(
  userId: string | undefined,
  sessionId: string | undefined,
  itemId: string,
): Promise<CartContext> {
  const context = await resolveCart(userId, sessionId);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== context.cart.id) {
    throw new ApiError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }
  await prisma.cartItem.delete({ where: { id: itemId } });

  const cart = await prisma.cart.findUnique({ where: { id: context.cart.id }, include: cartInclude });
  if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
  return { ...context, cart };
}

export async function migrateCartItems(
  userId: string | undefined,
  sessionId: string | undefined,
  items: { productId: string; variantId: string; quantity: number }[],
): Promise<CartContext> {
  const context = await resolveCart(userId, sessionId);
  if (items.length === 0) return context;

  const variantIds = Array.from(new Set(items.map((i) => i.variantId)));
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const variant = variantById.get(item.variantId);
      if (!variant || variant.productId !== item.productId) {
        throw new ApiError(400, "INVALID_VARIANT", "Invalid product variant");
      }
      if (variant.stock < item.quantity) {
        throw new ApiError(400, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
      }
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: context.cart.id, variantId: item.variantId } },
      });
      if (existing) {
        const combinedQty = existing.quantity + item.quantity;
        if (variant.stock < combinedQty) {
          throw new ApiError(400, "INSUFFICIENT_STOCK", "Not enough stock for this variant");
        }
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: combinedQty, priceSnapshot: variant.price },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: context.cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceSnapshot: variant.price,
          },
        });
      }
    }
  });

  const cart = await prisma.cart.findUnique({ where: { id: context.cart.id }, include: cartInclude });
  if (!cart) throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
  return { ...context, cart };
}
