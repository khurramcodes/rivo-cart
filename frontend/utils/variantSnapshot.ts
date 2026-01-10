export function parseVariantSnapshot(
  snapshot?: string | null
): Record<string, string> | null {
  if (!snapshot) return null;

  try {
    return JSON.parse(snapshot) as Record<string, string>;
  } catch {
    return null;
  }
}
