import { prisma } from "../prisma/client.js";
/**
 * Get dashboard statistics for admin
 */
export async function getDashboardStats() {
    const [productsCount, categoriesCount, ordersCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.order.count(),
    ]);
    return {
        productsCount,
        categoriesCount,
        ordersCount,
    };
}
