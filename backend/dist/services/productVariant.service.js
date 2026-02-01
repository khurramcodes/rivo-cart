import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
export async function createVariant(input) {
    // Check for duplicate SKU
    const existing = await prisma.productVariant.findUnique({ where: { sku: input.sku } });
    if (existing) {
        throw new ApiError(400, "SKU_EXISTS", `SKU "${input.sku}" already exists`);
    }
    return await prisma.productVariant.create({
        data: {
            productId: input.productId,
            sku: input.sku,
            price: input.price,
            stock: input.stock,
            isDefault: input.isDefault ?? false,
            attributes: input.attributes?.length
                ? {
                    create: input.attributes.map((attr) => ({
                        name: attr.name,
                        value: attr.value,
                    })),
                }
                : undefined,
        },
        include: {
            attributes: true,
        },
    });
}
export async function updateVariant(variantId, input) {
    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
        throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
    }
    // Check for duplicate SKU (excluding current variant)
    if (input.sku && input.sku !== existing.sku) {
        const duplicate = await prisma.productVariant.findUnique({ where: { sku: input.sku } });
        if (duplicate) {
            throw new ApiError(400, "SKU_EXISTS", `SKU "${input.sku}" already exists`);
        }
    }
    return await prisma.$transaction(async (tx) => {
        // Update variant
        const updated = await tx.productVariant.update({
            where: { id: variantId },
            data: {
                sku: input.sku,
                price: input.price,
                stock: input.stock,
                isDefault: input.isDefault,
            },
        });
        // Handle attributes if provided
        if (input.attributes) {
            // Delete existing attributes
            await tx.productVariantAttribute.deleteMany({ where: { variantId } });
            // Create new attributes
            if (input.attributes.length > 0) {
                await tx.productVariantAttribute.createMany({
                    data: input.attributes.map((attr) => ({
                        variantId,
                        name: attr.name,
                        value: attr.value,
                    })),
                });
            }
        }
        return tx.productVariant.findUniqueOrThrow({
            where: { id: variantId },
            include: { attributes: true },
        });
    });
}
export async function deleteVariant(variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
    if (!variant) {
        throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
    }
    // Prevent deletion if it's the only variant for a simple product
    const variantCount = await prisma.productVariant.count({ where: { productId: variant.productId } });
    if (variantCount === 1 && variant.product.type === "SIMPLE") {
        throw new ApiError(400, "CANNOT_DELETE_ONLY_VARIANT", "Cannot delete the only variant of a simple product");
    }
    await prisma.productVariant.delete({ where: { id: variantId } });
    return { success: true };
}
export async function decrementStock(variantId, quantity) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
        throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
    }
    if (variant.stock < quantity) {
        throw new ApiError(400, "INSUFFICIENT_STOCK", `Only ${variant.stock} units available`);
    }
    return await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: quantity } },
    });
}
