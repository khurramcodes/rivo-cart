import { prisma } from "../../prisma/client.js";

type Tx = any;
type DbClient = any;

function db(client?: Tx): DbClient {
  return client ?? prisma;
}

export async function createCollectionRecord(data: Record<string, unknown>, client?: Tx) {
  return (db(client) as any).collection.create({ data });
}

export async function updateCollectionRecord(
  id: string,
  data: Record<string, unknown>,
  client?: Tx,
) {
  return (db(client) as any).collection.update({ where: { id }, data });
}

export async function deleteCollectionRecord(id: string, client?: Tx) {
  return (db(client) as any).collection.delete({ where: { id } });
}

export async function findCollectionById(id: string, client?: Tx) {
  return (db(client) as any).collection.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: {
          product: {
            include: {
              galleryImages: { orderBy: { index: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function findCollectionBySlug(slug: string, client?: Tx) {
  return (db(client) as any).collection.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: {
          product: {
            include: {
              galleryImages: { orderBy: { index: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function listCollections(client?: Tx) {
  return (db(client) as any).collection.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function listActiveCollections(client?: Tx) {
  return (db(client) as any).collection.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function findCollectionSlugsByPrefix(prefix: string, excludeId?: string, client?: Tx) {
  const rows = await (db(client) as any).collection.findMany({
    where: {
      slug: { startsWith: prefix },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });
  return rows.map((row: { slug: string }) => row.slug);
}

export async function findProductsByIds(ids: string[], client?: Tx) {
  return (db(client) as any).product.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
}

export async function findCollectionProducts(collectionId: string, client?: Tx) {
  return (db(client) as any).productCollection.findMany({
    where: { collectionId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      product: {
        include: {
          galleryImages: { orderBy: { index: "asc" } },
        },
      },
    },
  });
}

export async function findCollectionProductsByProductIds(
  collectionId: string,
  productIds: string[],
  client?: Tx,
) {
  return (db(client) as any).productCollection.findMany({
    where: { collectionId, productId: { in: productIds } },
    select: { id: true, productId: true, position: true },
  });
}

export async function getMaxCollectionPosition(collectionId: string, client?: Tx) {
  const row = await (db(client) as any).productCollection.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  return row._max.position ?? 0;
}

export async function createCollectionProducts(
  data: any[],
  client?: Tx,
) {
  if (data.length === 0) return { count: 0 };
  return (db(client) as any).productCollection.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function updateCollectionProductPosition(
  collectionId: string,
  productId: string,
  position: number,
  client?: Tx,
) {
  return (db(client) as any).productCollection.update({
    where: { productId_collectionId: { collectionId, productId } },
    data: { position },
  });
}

export async function deleteCollectionProduct(collectionId: string, productId: string, client?: Tx) {
  return (db(client) as any).productCollection.delete({
    where: { productId_collectionId: { collectionId, productId } },
  });
}
