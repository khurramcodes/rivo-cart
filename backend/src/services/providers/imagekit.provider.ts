import ImageKit from "imagekit";
import { ApiError } from "../../utils/ApiError.js";

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

function getClient() {
  return new ImageKit({
    publicKey: mustGetEnv("IMAGEKIT_PUBLIC_KEY"),
    privateKey: mustGetEnv("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: mustGetEnv("IMAGEKIT_URL_ENDPOINT"),
  });
}

function getBaseFolder() {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction
    ? (process.env.PRODUCT_IMAGE_FOLDER_BASE_PROD ?? "RivoCart")
    : (process.env.PRODUCT_IMAGE_FOLDER_BASE_DEV ?? "RivoCart-dev");
}

/**
 * ImageKit implementation of StorageProvider.
 * Key format: "resourceType/resourceId/fileType.webp" (e.g. "products/abc123/main.webp")
 * ImageKit path: "{baseFolder}/{key}"
 */
export async function upload(
  fileBuffer: Buffer,
  key: string,
  mimeType: string,
): Promise<{ url: string; key: string }> {
  const ik = getClient();
  const baseFolder = getBaseFolder();
  const fullPath = `${baseFolder}/${key}`.replace(/\/+/g, "/");
  const lastSlash = fullPath.lastIndexOf("/");
  const folder = lastSlash > 0 ? fullPath.slice(0, lastSlash) : fullPath;
  const fileName = lastSlash > 0 ? fullPath.slice(lastSlash + 1) : fullPath;

  const result = await ik.upload({
    file: fileBuffer,
    fileName,
    folder: folder.startsWith("/") ? folder.slice(1) : folder,
    useUniqueFileName: false,
    overwriteFile: true,
  });

  return {
    url: result.url,
    key,
  };
}

export async function deleteByKey(key: string): Promise<void> {
  const ik = getClient();
  const baseFolder = getBaseFolder();
  // Support both new format (products/id/main.webp) and legacy full path
  const fullPath = key.startsWith(baseFolder) ? key : `${baseFolder}/${key}`.replace(/\/+/g, "/");
  const lastSlash = fullPath.lastIndexOf("/");
  const folder = lastSlash > 0 ? fullPath.slice(0, lastSlash) : fullPath;
  const fileName = lastSlash > 0 ? fullPath.slice(lastSlash + 1) : fullPath;

  // ImageKit deleteFile requires fileId; list files in folder to find it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyIk = ik as any;
  if (typeof anyIk.listFiles !== "function") return;
  const res = await anyIk.listFiles({ path: folder });
  const files = Array.isArray(res) ? res : res?.results ?? [];
  const match = files.find(
    (f: { name?: string; filePath?: string }) =>
      f.name === fileName || f.filePath?.endsWith(fileName),
  );
  if (match?.fileId) {
    await ik.deleteFile(match.fileId);
  }
}
