import ImageKit from "imagekit";
import { ApiError } from "../utils/ApiError.js";

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

export async function deleteFile(fileId: string) {
  const ik = getClient();
  await ik.deleteFile(fileId);
}

export async function listFilesInPath(path: string) {
  const ik = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyIk = ik as any;
  if (typeof anyIk.listFiles !== "function") return [];
  const res = await anyIk.listFiles({ path });
  return Array.isArray(res) ? res : res?.results ?? [];
}

export async function deleteFolder(folderPath: string) {
  const ik = getClient();
  // best-effort: ImageKit only deletes empty folders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyIk = ik as any;
  if (typeof anyIk.deleteFolder === "function") {
    await anyIk.deleteFolder(folderPath);
  }
}

export function folderFromFilePath(filePath: string) {
  const idx = filePath.lastIndexOf("/");
  if (idx <= 0) return "";
  return filePath.slice(0, idx);
}

export function normalizeFolderPath(path: string) {
  const trimmed = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed;
}


