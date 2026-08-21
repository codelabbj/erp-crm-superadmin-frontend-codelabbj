export function planPeriodProgress(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt || !endsAt) return null;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const now = Date.now();
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(totalMs, now - start));
  const remainingMs = Math.max(0, end - now);

  return {
    elapsedPct: Math.round((elapsedMs / totalMs) * 100),
    daysTotal: Math.max(1, Math.ceil(totalMs / 86_400_000)),
    daysElapsed: Math.ceil(elapsedMs / 86_400_000),
    daysRemaining: Math.ceil(remainingMs / 86_400_000),
  };
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export const MODULE_LABELS: Record<string, string> = {
  crm: "CRM & ventes",
  billing: "Facturation",
  inventory: "Inventaire",
  projects: "Projets",
  support: "Support",
  hr: "RH & paie",
  accounting: "Comptabilité",
  marketing: "Marketing",
  pos: "Point de vente",
  ecommerce: "E-commerce",
};
