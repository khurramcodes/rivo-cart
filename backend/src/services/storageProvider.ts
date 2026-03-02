/**
 * Provider-agnostic storage interface.
 * Implementations handle upload and delete for a specific storage backend (e.g. ImageKit).
 */
export interface StorageProvider {
  /**
   * Upload a file to storage.
   * @param fileBuffer - Raw file bytes
   * @param key - Storage key (e.g. "products/abc123/main.webp")
   * @param mimeType - MIME type of the file
   * @returns URL and key of the uploaded file
   */
  upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<{
    url: string;
    key: string;
  }>;

  /**
   * Delete a file from storage by its key.
   * @param key - Storage key (e.g. "products/abc123/main.webp")
   */
  delete(key: string): Promise<void>;
}
