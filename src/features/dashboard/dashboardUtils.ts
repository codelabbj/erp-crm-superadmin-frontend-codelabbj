export function formatMoney(
  value: number | undefined | null,
  currency = "EUR",
  locale = "fr-FR",
): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | undefined | null, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)} %`;
}

export function aggregateByField<T>(
  items: T[],
  field: keyof T,
  labelFn?: (v: string) => string,
): Array<{ key: string; label: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const raw = String(item[field] ?? "").trim() || "—";
    map.set(raw, (map.get(raw) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({
      key,
      label: labelFn ? labelFn(key) : key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function countryFlag(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.length !== 2 || c === "—") return "🌍";
  return String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0)));
}
