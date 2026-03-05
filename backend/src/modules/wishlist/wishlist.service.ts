import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utils/ApiError.js";

export async function toggleWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { id: existing.id },
    });
    return { added: false };
  }

  await prisma.wishlist.create({
    data: { userId, productId },
  });
  return { added: true };
}

export async function listWishlist(userId: string) {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          variants: true,
        },
      },
    },
  });
  return items;
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}
