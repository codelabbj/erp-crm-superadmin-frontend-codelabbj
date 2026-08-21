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

/** "2025-06" → "juin 25" */
export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  return `${month} ${String(y).slice(-2)}`;
}

/** Regroupe les orgs par mois de création (YYYY-MM). */
export function seriesNewOrgsByMonth(
  orgs: Array<{ created_at: string }>,
  maxMonths = 12,
): Array<{ month: string; count: number }> {
  const map = new Map<string, number>();
  for (const o of orgs) {
    const d = new Date(o.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxMonths)
    .map(([month, count]) => ({ month, count }));
}
