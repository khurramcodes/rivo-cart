import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  createCollectionProducts,
  createCollectionRecord,
  deleteCollectionProduct,
  deleteCollectionRecord,
  findCollectionById,
  findCollectionBySlug,
  findCollectionProducts,
  findCollectionProductsByProductIds,
  findCollectionSlugsByPrefix,
  findProductsByIds,
  getMaxCollectionPosition,
  listActiveCollections,
  listCollections,
  updateCollectionProductPosition,
  updateCollectionRecord,
} from "./collection.repository.js";
import { normalizeCollectionTitle, toCollectionSlug, uniqueStrings } from "./collection.utils.js";

type CreateCollectionInput = {
  title: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

type UpdateCollectionInput = {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

type ReorderItemsInput = {
  productId: string;
  position: number;
}[];

function getNextSlug(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let max = 0;
  const prefix = `${base}-`;
  for (const slug of existing) {
    if (!slug.startsWith(prefix)) continue;
    const suffix = Number(slug.slice(prefix.length));
    if (Number.isInteger(suffix) && suffix > max) max = suffix;
  }
  return `${base}-${max + 1}`;
}

async function generateCollectionSlug(title: string, excludeId?: string) {
  const base = toCollectionSlug(title);
  const existing = await findCollectionSlugsByPrefix(base, excludeId);
  return getNextSlug(base, existing);
}

async function ensureCollectionExists(id: string, tx?: Prisma.TransactionClient) {
  const collection = (await findCollectionById(id, tx)) as any;
  if (!collection) {
    throw new ApiError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  }
  return collection;
}

async function assertProductsExist(productIds: string[], tx?: Prisma.TransactionClient) {
  const uniqueIds = uniqueStrings(productIds);
  const products = await findProductsByIds(uniqueIds, tx);
  const found = new Set(products.map((p: { id: string }) => p.id));
  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new ApiError(
      400,
      "INVALID_PRODUCT_IDS",
      `Some product IDs do not exist: ${missing.join(", ")}`,
    );
  }
}

async function compactPositions(collectionId: string, tx: Prisma.TransactionClient) {
  const rows = await findCollectionProducts(collectionId, tx);
  for (let index = 0; index < rows.length; index += 1) {
    const nextPosition = index + 1;
    if (rows[index].position !== nextPosition) {
      await updateCollectionProductPosition(
        collectionId,
        rows[index].productId,
        nextPosition,
        tx,
      );
    }
  }
}

export async function createCollection(data: CreateCollectionInput) {
  const title = normalizeCollectionTitle(data.title);
  const slug = await generateCollectionSlug(data.slug?.trim() || title);
  return createCollectionRecord({
    title,
    slug,
    description: data.description?.trim() || null,
    isActive: data.isActive ?? true,
  });
}

export async function updateCollection(id: string, data: UpdateCollectionInput) {
  const existing = await ensureCollectionExists(id);
  const updateData: Record<string, unknown> = {};
  const nextTitle = data.title !== undefined ? normalizeCollectionTitle(data.title) : existing.title;

  if (data.title !== undefined) {
    updateData.title = nextTitle;
  }
  if (data.slug !== undefined) {
    updateData.slug = await generateCollectionSlug(data.slug.trim(), id);
  } else if (data.title !== undefined && nextTitle !== existing.title) {
    updateData.slug = await generateCollectionSlug(nextTitle, id);
  }
  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  return updateCollectionRecord(id, updateData);
}

export async function deleteCollection(id: string) {
  await ensureCollectionExists(id);
  await deleteCollectionRecord(id);
}

export async function getAllCollections() {
  return listCollections();
}

export async function getCollectionById(id: string) {
  return ensureCollectionExists(id);
}

export async function getCollectionBySlug(slug: string) {
  const collection = (await findCollectionBySlug(slug)) as any;
  if (!collection || !collection.isActive) {
    throw new ApiError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  }
  return collection;
}

export async function addProducts(collectionId: string, productIds: string[]) {
  const uniqueProductIds = uniqueStrings(productIds);
  if (uniqueProductIds.length === 0) {
    throw new ApiError(400, "INVALID_PRODUCT_IDS", "At least one productId is required");
  }

  return prisma.$transaction(async (tx) => {
    await ensureCollectionExists(collectionId, tx);
    await assertProductsExist(uniqueProductIds, tx);

    const existingLinks = await findCollectionProductsByProductIds(collectionId, uniqueProductIds, tx);
    const alreadyLinked = new Set(existingLinks.map((row: { productId: string }) => row.productId));
    const toInsert = uniqueProductIds.filter((id) => !alreadyLinked.has(id));

    if (toInsert.length > 0) {
      const maxPosition = await getMaxCollectionPosition(collectionId, tx);
      await createCollectionProducts(
        toInsert.map((productId, index) => ({
          collectionId,
          productId,
          position: maxPosition + index + 1,
        })),
        tx,
      );
    }

    return findCollectionProducts(collectionId, tx);
  });
}

export async function removeProduct(collectionId: string, productId: string) {
  return prisma.$transaction(async (tx) => {
    await ensureCollectionExists(collectionId, tx);
    await assertProductsExist([productId], tx);
    try {
      await deleteCollectionProduct(collectionId, productId, tx);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(
          404,
          "COLLECTION_PRODUCT_NOT_FOUND",
          "Product is not in this collection",
        );
      }
      throw error;
    }
    await compactPositions(collectionId, tx);
    return findCollectionProducts(collectionId, tx);
  });
}

export async function reorderProducts(collectionId: string, items: ReorderItemsInput) {
  const uniqueIds = uniqueStrings(items.map((item) => item.productId));
  if (uniqueIds.length !== items.length) {
    throw new ApiError(400, "DUPLICATE_PRODUCTS", "Duplicate product IDs in reorder payload");
  }

  const positions = items.map((item) => item.position);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    throw new ApiError(400, "DUPLICATE_POSITIONS", "Duplicate positions are not allowed");
  }

  return prisma.$transaction(async (tx) => {
    await ensureCollectionExists(collectionId, tx);
    await assertProductsExist(uniqueIds, tx);

    const existingLinks = await findCollectionProductsByProductIds(collectionId, uniqueIds, tx);
    if (existingLinks.length !== uniqueIds.length) {
      throw new ApiError(
        400,
        "INVALID_COLLECTION_PRODUCTS",
        "All products must already belong to the collection before reorder",
      );
    }

    for (const item of items) {
      await updateCollectionProductPosition(
        collectionId,
        item.productId,
        item.position,
        tx,
      );
    }

    return findCollectionProducts(collectionId, tx);
  });
}

export async function getCollectionProducts(collectionId: string) {
  await ensureCollectionExists(collectionId);
  return findCollectionProducts(collectionId);
}

export async function getPublicCollections() {
  return listActiveCollections();
}
