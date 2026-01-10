import axios from "axios";
import { adminApi } from "./adminApi";

function normalizeFolder(folderPath: string) {
  const trimmed = folderPath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${trimmed}`;
}

export async function uploadToImageKit(
  file: File,
  folderPath: string,
  fileName: string,
  overwriteFileId?: string | null,
) {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!publicKey) throw new Error("Missing NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY");

  const auth = await adminApi.imagekitAuth();
  const folder = normalizeFolder(folderPath);

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", fileName);
  form.append("folder", folder);
  form.append("useUniqueFileName", "false");
  form.append("overwriteFile", "true");
  // critical for overwrite UX: purge CDN so same URL shows new bytes immediately
  form.append("invalidateCache", "true");
  if (overwriteFileId) form.append("overwriteFileId", overwriteFileId);
  form.append("publicKey", publicKey);
  form.append("signature", auth.signature);
  form.append("token", auth.token);
  form.append("expire", String(auth.expire));

  const { data } = await axios.post("https://upload.imagekit.io/api/v1/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data as { url: string; thumbnailUrl?: string; fileId: string; filePath: string };
}


