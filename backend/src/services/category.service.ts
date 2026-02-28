import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { generateCategorySlug } from "../utils/slug.js";

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function listBestSellingCategories(limit: number = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: {
      order: {
        status: { not: "CANCELLED" },
      },
    },
  });

  if (grouped.length === 0) return [];

  const productCategoryRows = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    select: { id: true, categoryId: true },
  });
  const productToCategory = new Map(productCategoryRows.map((r) => [r.id, r.categoryId]));

  const categoryTotals = new Map<string, number>();
  for (const row of grouped) {
    const categoryId = productToCategory.get(row.productId);
    if (!categoryId) continue;
    const qty = row._sum.quantity ?? 0;
    categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + qty);
  }

  const top = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (top.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: top.map(([categoryId]) => categoryId) } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      imageUrl: true,
      imageFileId: true,
      imageFilePath: true,
      imageFolderPath: true,
      createdAt: true,
    },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return top
    .map(([categoryId, soldQuantity]) => {
      const category = categoryMap.get(categoryId);
      if (!category) return null;
      return { ...category, soldQuantity };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
  });
  if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return category;
}

export async function createCategory(input: {
  name: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  imageFileId?: string;
  imageFilePath?: string;
  imageFolderPath?: string;
}) {
  const name = input.name.trim();
  const slug = await generateCategorySlug(name);
  try {
    return await prisma.category.create({
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
        parentId: input.parentId ?? null,
        imageUrl: input.imageUrl ?? null,
        imageFileId: input.imageFileId ?? null,
        imageFilePath: input.imageFilePath ?? null,
        imageFolderPath: input.imageFolderPath ?? null,
      },
    });
  } catch {
    throw new ApiError(409, "CATEGORY_EXISTS", "Category name already exists");
  }
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    description?: string;
    parentId?: string | null;
    imageUrl?: string | null;
    imageFileId?: string | null;
    imageFilePath?: string | null;
    imageFolderPath?: string | null;
  },
) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.parentId !== undefined) data.parentId = input.parentId;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.imageFileId !== undefined) data.imageFileId = input.imageFileId;
  if (input.imageFilePath !== undefined) data.imageFilePath = input.imageFilePath;
  if (input.imageFolderPath !== undefined) data.imageFolderPath = input.imageFolderPath;

  try {
    return await prisma.category.update({ where: { id }, data });
  } catch {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
}


