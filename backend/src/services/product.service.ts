import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { generateProductSlug } from "../utils/slug.js";
import { deleteFile, listFilesInPath, folderFromFilePath, normalizeFolderPath } from "./imagekit.service.js";


// Helper function to get all descendant category IDs
async function getDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });

  const map = new Map<string, string[]>();

  for (const cat of categories) {
    if (!cat.parentId) continue;
    if (!map.has(cat.parentId)) map.set(cat.parentId, []);
    map.get(cat.parentId)!.push(cat.id);
  }

  const result: string[] = [];
  const stack = [categoryId];

  while (stack.length) {
    const current = stack.pop()!;
    result.push(current);

    const children = map.get(current) || [];
    stack.push(...children);
  }

  return result;
}


export async function listProducts(input: {
  q?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "category" | "price" | "stock" | "type" | "createdAt";
  sortDir?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 12;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (input.categoryId) {
    const categoryIds = await getDescendantCategoryIds(input.categoryId);

    where.categoryId = {
      in: categoryIds,
    };
  }

  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
    ];
  }
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    const priceFilter: { gte?: number; lte?: number } = {};
    if (input.minPrice !== undefined) priceFilter.gte = input.minPrice;
    if (input.maxPrice !== undefined) priceFilter.lte = input.maxPrice;
    where.variants = { some: { price: priceFilter } };
  }

  const sortDir = input.sortDir ?? "desc";
  const sortBy = input.sortBy ?? "createdAt";
  const orderBy: any[] = [];

  if (sortBy === "name") orderBy.push({ name: sortDir });
  if (sortBy === "type") orderBy.push({ type: sortDir });
  if (sortBy === "category") orderBy.push({ category: { name: sortDir } });
  if (sortBy === "price") orderBy.push({ variants: { _min: { price: sortDir } } });
  if (sortBy === "stock") orderBy.push({ variants: { _sum: { stock: sortDir } } });
  if (sortBy === "createdAt") orderBy.push({ createdAt: sortDir });
  orderBy.push({ createdAt: "desc" });

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        galleryImages: { orderBy: { index: "asc" } },
        highlights: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        variants: {
          include: { attributes: true },
          orderBy: { isDefault: "desc" },
        },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function listLatestProducts(limit: number = 6) {
  return prisma.product.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      imageUrl: true,
      updatedAt: true,
      ratingAverage: true,
      ratingCount: true,
      reviewCount: true,

      // fetch ALL variant prices (lightweight)
      variants: {
        select: {
          id: true,
          price: true,
          stock: true,
          isDefault: true,
        },
      },
    },
  });
}

export async function listBestSellingProducts(limit: number = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: {
      order: {
        status: { not: "CANCELLED" },
      },
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const idsInOrder = grouped.map((row) => row.productId);
  const productMap = new Map(
    (
      await prisma.product.findMany({
        where: { id: { in: idsInOrder } },
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          updatedAt: true,
          ratingAverage: true,
          ratingCount: true,
          reviewCount: true,
          variants: {
            select: { id: true, price: true, stock: true, isDefault: true },
          },
        },
      })
    ).map((p) => [p.id, p]),
  );

  return idsInOrder
    .map((id) => {
      const product = productMap.get(id);
      const group = grouped.find((g) => g.productId === id);
      if (!product || !group) return null;
      return {
        ...product,
        soldQuantity: group._sum.quantity ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}


export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      galleryImages: { orderBy: { index: "asc" } },
      highlights: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
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
  highlights?: { text: string; sortOrder?: number }[];
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

    const slug = await generateProductSlug(input.name);
    const cleanedHighlights =
      input.highlights
        ?.map((h, idx) => ({
          text: h.text.trim(),
          sortOrder: h.sortOrder ?? idx,
        }))
        .filter((h) => h.text.length > 0) ?? [];

    return await prisma.product.create({
      data: {
        id: input.id,
        name: input.name.trim(),
        slug,
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
        highlights: cleanedHighlights.length
          ? {
              create: cleanedHighlights.map((h) => ({
                text: h.text,
                sortOrder: h.sortOrder,
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
        highlights: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
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
    highlights?: { text: string; sortOrder?: number }[];
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
      highlights: true,
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

      if (input.highlights !== undefined) {
        const cleanedHighlights = input.highlights
          .map((h, idx) => ({
            text: h.text.trim(),
            sortOrder: h.sortOrder ?? idx,
          }))
          .filter((h) => h.text.length > 0);

        await tx.productHighlight.deleteMany({ where: { productId: id } });
        if (cleanedHighlights.length > 0) {
          await tx.productHighlight.createMany({
            data: cleanedHighlights.map((h) => ({
              productId: id,
              text: h.text,
              sortOrder: h.sortOrder,
            })),
          });
        }
      }

      return p;
    });

    return await prisma.product.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        galleryImages: { orderBy: { index: "asc" } },
        highlights: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
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

    // Delete all cart items associated with the product
    await prisma.cartItem.deleteMany({
      where: {
        productId: id,
      },
    });

    // Delete product (cascades to variants, attributes, and gallery images)
    await prisma.product.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    console.error("Error deleting product:", e);
    throw new ApiError(500, "DELETE_FAILED", "Failed to delete product");
  }
}