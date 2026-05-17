/**
 * Format a money amount given in minor units. MWK has no commonly-used minor
 * unit so the helper treats 1 minor = 1 MWK. For currencies with decimals
 * (USD, EUR, etc.) the function divides by 100 before formatting.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "MWK",
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function formatMoney(amountMinor: number, currency = "MWK"): string {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  const amount = isZeroDecimal ? amountMinor : amountMinor / 100;

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}
