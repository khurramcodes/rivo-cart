import { apiClient } from "./apiClient";

export type ResourceType = "products" | "categories";
export type FileType = "main" | "gallery-1" | "gallery-2" | "gallery-3";

export interface UploadResult {
  url: string;
  fileKey: string;
}

export interface UploadOptions {
  /** Required for categories - the category slug */
  slug?: string;
}

export async function uploadFile(
  file: File,
  resourceId: string,
  resourceType: ResourceType,
  fileType: FileType,
  options?: UploadOptions,
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("resourceId", resourceId);
  form.append("resourceType", resourceType);
  form.append("fileType", fileType);
  if (resourceType === "categories" && options?.slug) {
    form.append("slug", options.slug);
  }

  const { data } = await apiClient.post<UploadResult>("/upload", form);
  return data;
}
