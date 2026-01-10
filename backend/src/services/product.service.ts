import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFile, listFilesInPath, folderFromFilePath, normalizeFolderPath } from "./imagekit.service.js";

export async function listProducts(input: { q?: string; categoryId?: string; page?: number; limit?: number }) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 12;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (input.categoryId) where.categoryId = input.categoryId;
  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        galleryImages: { orderBy: { index: "asc" } },
        variants: {
          include: { attributes: true },
          orderBy: { isDefault: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      galleryImages: { orderBy: { index: "asc" } },
      variants: {
        include: { attributes: true },
        orderBy: { isDefault: "desc" },
      },
    },
  });
  if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return product;
}

export async function createProduct(input: {
  id: string;
  name: string;
  description?: string;
  type: "SIMPLE" | "VARIABLE";
  imageUrl: string;
  imageFileId: string;
  imageFilePath: string;
  imageFolderPath: string;
  thumbUrl?: string;
  thumbFileId?: string;
  thumbFilePath?: string;
  gallery?: { index: number; url: string; fileId: string; filePath: string }[];
  categoryId: string;
  variants: {
    sku: string;
    price: number; // cents
    stock: number;
    isDefault?: boolean;
    attributes?: { name: string; value: string }[];
  }[];
}) {
  try {
    // Validate folder paths
    const expected = normalizeFolderPath(input.imageFolderPath);
    const mainActual = normalizeFolderPath(folderFromFilePath(input.imageFilePath));
    if (expected !== mainActual) {
      throw new ApiError(400, "IMAGE_FOLDER_MISMATCH", "Main image must be uploaded to the product folder");
    }
    if (input.thumbFilePath) {
      const thumbActual = normalizeFolderPath(folderFromFilePath(input.thumbFilePath));
      if (expected !== thumbActual) {
        throw new ApiError(400, "IMAGE_FOLDER_MISMATCH", "Thumb image must be uploaded to the product folder");
      }
    }
    if (input.gallery?.length) {
      for (const g of input.gallery) {
        const gActual = normalizeFolderPath(folderFromFilePath(g.filePath));
        if (expected !== gActual) {
          throw new ApiError(400, "IMAGE_FOLDER_MISMATCH", "Gallery image must be uploaded to the product folder");
        }
      }
    }

    // Validate variants
    if (!input.variants || input.variants.length === 0) {
      throw new ApiError(400, "NO_VARIANTS", "At least one variant is required");
    }

    // Check for duplicate SKUs in the input
    const skus = input.variants.map((v) => v.sku);
    const duplicateSkus = skus.filter((sku, idx) => skus.indexOf(sku) !== idx);
    if (duplicateSkus.length > 0) {
      throw new ApiError(400, "DUPLICATE_SKU", `Duplicate SKU(s) in request: ${duplicateSkus.join(", ")}`);
    }

    // Check if any SKU already exists in database
    const existingSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
    if (existingSkus.length > 0) {
      throw new ApiError(
        400,
        "SKU_EXISTS",
        `SKU(s) already exist: ${existingSkus.map((s) => s.sku).join(", ")}`,
      );
    }

    // Ensure exactly one default variant if SIMPLE, or handle defaults properly if VARIABLE
    if (input.type === "SIMPLE" && input.variants.length !== 1) {
      throw new ApiError(400, "INVALID_SIMPLE_PRODUCT", "Simple products must have exactly one variant");
    }

    return await prisma.product.create({
      data: {
        id: input.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        type: input.type,
        imageUrl: input.imageUrl,
        imageFileId: input.imageFileId,
        imageFilePath: input.imageFilePath,
        imageFolderPath: input.imageFolderPath,
        thumbUrl: input.thumbUrl,
        thumbFileId: input.thumbFileId,
        thumbFilePath: input.thumbFilePath,
        categoryId: input.categoryId,
        galleryImages: input.gallery
          ? {
              create: input.gallery.map((g) => ({
                index: g.index,
                url: g.url,
                fileId: g.fileId,
                filePath: g.filePath,
              })),
            }
          : undefined,
        variants: {
          create: input.variants.map((v, idx) => ({
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            isDefault: input.type === "SIMPLE" ? true : v.isDefault ?? idx === 0, // First variant is default if not specified
            attributes: v.attributes?.length
              ? {
                  create: v.attributes.map((attr) => ({
                    name: attr.name,
                    value: attr.value,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        galleryImages: { orderBy: { index: "asc" } },
        variants: {
          include: { attributes: true },
          orderBy: { isDefault: "desc" },
        },
      },
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("Error creating product:", e);
    throw new ApiError(400, "INVALID_PRODUCT", "Invalid product data");
  }
}

export async function updateProduct(
  id: string,
  input: {
    name?: string;
    description?: string;
    type?: "SIMPLE" | "VARIABLE";
    imageUrl?: string;
    imageFileId?: string;
    imageFilePath?: string;
    thumbUrl?: string;
    thumbFileId?: string;
    thumbFilePath?: string;
    gallery?: { index: number; url: string; fileId: string; filePath: string }[];
    deleteGalleryIndexes?: number[];
    categoryId?: string;
    variants?: {
      id?: string; // if updating existing variant
      sku: string;
      price: number;
      stock: number;
      isDefault?: boolean;
      attributes?: { name: string; value: string }[];
    }[];
    deleteVariantIds?: string[]; // variants to delete
  },
) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      galleryImages: true,
      variants: {
        include: { attributes: true },
      },
    },
  });
  if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");

  const data: any = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.type !== undefined) data.type = input.type;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.imageFileId !== undefined) data.imageFileId = input.imageFileId;
  if (input.imageFilePath !== undefined) data.imageFilePath = input.imageFilePath;
  if (input.thumbUrl !== undefined) data.thumbUrl = input.thumbUrl;
  if (input.thumbFileId !== undefined) data.thumbFileId = input.thumbFileId;
  if (input.thumbFilePath !== undefined) data.thumbFilePath = input.thumbFilePath;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;

  try {
    // Folder path validation
    if (input.imageFilePath && existing.imageFolderPath) {
      const expected = normalizeFolderPath(existing.imageFolderPath);
      const actual = normalizeFolderPath(folderFromFilePath(input.imageFilePath));
      if (expected !== actual) {
        throw new ApiError(400, "IMAGE_FOLDER_MISMATCH", "Images must stay in the same product folder");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update product base info
      const p = await tx.product.update({ where: { id }, data });

      // Handle gallery image updates
      if (input.gallery?.length) {
        for (const g of input.gallery) {
          await tx.productGalleryImage.upsert({
            where: { productId_index: { productId: id, index: g.index } },
            update: { url: g.url, fileId: g.fileId, filePath: g.filePath },
            create: { productId: id, index: g.index, url: g.url, fileId: g.fileId, filePath: g.filePath },
          });
        }
      }

      // Handle gallery image deletions
      if (input.deleteGalleryIndexes?.length) {
        for (const index of input.deleteGalleryIndexes) {
          const toDelete = existing.galleryImages?.find((g) => g.index === index);
          if (toDelete) {
            await deleteFile(toDelete.fileId);
            await tx.productGalleryImage.delete({
              where: { productId_index: { productId: id, index } },
            });
          }
        }
      }

      // Handle variant updates
      if (input.variants) {
        for (const v of input.variants) {
          if (v.id) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                isDefault: v.isDefault,
              },
            });

            // Update attributes
            if (v.attributes !== undefined) {
              // Delete old attributes
              await tx.productVariantAttribute.deleteMany({ where: { variantId: v.id } });
              // Create new attributes
              if (v.attributes.length > 0) {
                await tx.productVariantAttribute.createMany({
                  data: v.attributes.map((attr) => ({
                    variantId: v.id!,
                    name: attr.name,
                    value: attr.value,
                  })),
                });
              }
            }
          } else {
            // Create new variant
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                isDefault: v.isDefault ?? false,
                attributes: v.attributes?.length
                  ? {
                      create: v.attributes.map((attr) => ({
                        name: attr.name,
                        value: attr.value,
                      })),
                    }
                  : undefined,
              },
            });
          }
        }
      }

      // Handle variant deletions
      if (input.deleteVariantIds?.length) {
        // Ensure we don't delete all variants
        const remainingCount = await tx.productVariant.count({
          where: {
            productId: id,
            id: { notIn: input.deleteVariantIds },
          },
        });

        if (remainingCount === 0) {
          throw new ApiError(400, "CANNOT_DELETE_ALL_VARIANTS", "Cannot delete all variants");
        }

        await tx.productVariant.deleteMany({
          where: {
            id: { in: input.deleteVariantIds },
            productId: id,
          },
        });
      }

      return p;
    });

    return await prisma.product.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        galleryImages: { orderBy: { index: "asc" } },
        variants: {
          include: { attributes: true },
          orderBy: { isDefault: "desc" },
        },
      },
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("Error updating product:", e);
    throw new ApiError(400, "INVALID_PRODUCT_UPDATE", "Invalid product update");
  }
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { galleryImages: true, variants: true },
  });
  if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");

  try {
    // Delete all images from ImageKit if folder exists
    if (product.imageFolderPath) {
      const files = await listFilesInPath(product.imageFolderPath);
      for (const file of files) {
        await deleteFile(file.fileId);
      }
    }

    // Delete product (cascades to variants, attributes, and gallery images)
    await prisma.product.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    console.error("Error deleting product:", e);
    throw new ApiError(500, "DELETE_FAILED", "Failed to delete product");
  }
}

