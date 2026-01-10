export function formatMoney(cents: number, currency = "USD") {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(dollars);
}


