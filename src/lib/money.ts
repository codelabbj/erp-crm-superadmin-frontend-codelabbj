/** Devise par défaut de la plateforme (Franc CFA BCEAO). */
export const DEFAULT_CURRENCY = "XOF";

export function formatMoney(
  value: number | undefined | null,
  currency = DEFAULT_CURRENCY,
  locale = "fr-FR",
): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Montant API (string/number) → affichage CFA. */
export function formatMoneyFromApi(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return "—";
  return formatMoney(n);
}
