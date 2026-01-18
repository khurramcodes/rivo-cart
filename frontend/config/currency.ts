/**
 * Global currency configuration
 * Use this constant consistently throughout the application
 */
export const CURRENCY = {
  symbol: "PKR",
  code: "PKR",
  position: "before", // 'before' | 'after'
} as const;

/**
 * Format a price with the global currency
 * @param amountInCents - Price in cents/paisa
 * @returns Formatted price string
 */
export function formatPrice(amountInCents: number): string {
  const amount = new Intl.NumberFormat("en-PK", {
    // minimumFractionDigits: 2,
    // maximumFractionDigits: 2,
  }).format(amountInCents / 100);
  return CURRENCY.position === "before"
    ? `${CURRENCY.symbol} ${amount}`
    : `${amount} ${CURRENCY.symbol}`;
}

