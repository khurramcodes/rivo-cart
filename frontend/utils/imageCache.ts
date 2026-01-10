/**
 * Add cache-busting parameters to image URLs
 * @param url - The base image URL
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns URL with cache-busting parameters
 */
export function addCacheBust(url: string | null | undefined, timestamp?: string | number): string {
  if (!url) return "";
  
  const ts = timestamp || Date.now();
  const separator = url.includes("?") ? "&" : "?";
  
  // Add both timestamp and ImageKit cache-busting parameter
  return `${url}${separator}v=${ts}&ik-cache=${ts}`;
}

/**
 * Force refresh an image by clearing browser cache
 */
export function forceImageRefresh(url: string): string {
  return addCacheBust(url, Date.now());
}

