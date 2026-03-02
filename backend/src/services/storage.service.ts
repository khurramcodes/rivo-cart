import { ApiError } from "../utils/ApiError.js";
import * as imagekitProvider from "./providers/imagekit.provider.js";

const RESOURCE_TYPES = ["products", "categories"] as const;
const FILE_TYPES = ["main", "gallery-1", "gallery-2", "gallery-3"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type FileType = (typeof FILE_TYPES)[number];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildStorageKey(
  resourceType: ResourceType,
  resourceId: string,
  fileType: FileType,
  slug?: string,
): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = pad2(now.getMonth() + 1);

  if (resourceType === "products") {
    return `${resourceType}/${year}/${month}/prod_${resourceId}/${fileType}.webp`;
  }
  if (resourceType === "categories") {
    if (!slug?.trim()) {
      throw new ApiError(400, "MISSING_SLUG", "slug is required for category uploads");
    }
    const safeSlug = slug.trim().replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-");
    return `${resourceType}/${year}/${month}/${safeSlug}_${resourceId}/${fileType}.webp`;
  }
  throw new ApiError(400, "INVALID_RESOURCE_TYPE", `resourceType must be one of: ${RESOURCE_TYPES.join(", ")}`);
}

export async function uploadFile(input: {
  fileBuffer: Buffer;
  resourceId: string;
  resourceType: ResourceType;
  fileType: FileType;
  mimeType: string;
  slug?: string;
}): Promise<{ url: string; fileKey: string }> {
  if (!input.resourceId?.trim()) {
    throw new ApiError(400, "INVALID_RESOURCE_ID", "resourceId is required");
  }
  if (!RESOURCE_TYPES.includes(input.resourceType)) {
    throw new ApiError(400, "INVALID_RESOURCE_TYPE", `resourceType must be one of: ${RESOURCE_TYPES.join(", ")}`);
  }
  if (!FILE_TYPES.includes(input.fileType)) {
    throw new ApiError(400, "INVALID_FILE_TYPE", `fileType must be one of: ${FILE_TYPES.join(", ")}`);
  }

  const key = buildStorageKey(
    input.resourceType,
    input.resourceId,
    input.fileType,
    input.resourceType === "categories" ? input.slug : undefined,
  );
  const result = await imagekitProvider.upload(input.fileBuffer, key, input.mimeType);
  return { url: result.url, fileKey: result.key };
}

export async function deleteFile(key: string): Promise<void> {
  await imagekitProvider.deleteByKey(key);
}
