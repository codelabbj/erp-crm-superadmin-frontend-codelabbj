export type Tab =
  | "overview"
  | "platformHealth"
  | "businessMetrics"
  | "organizations"
  | "onboarding"
  | "domainsSsl"
  | "subscriptions"
  | "subscriptionsStats"
  | "subscriptionsAlerts"
  | "plansFeatures"
  | "invoices"
  | "featureFlags"
  | "modules"
  | "backgroundJobs"
  | "staffUsers"
  | "auditLogs"
  | "bannedIpsWaf"
  | "billingOps"
  | "dataOps"
  | "marketing"
  | "support"
  | "projects"
  | "ecommerce"
  | "fiscal"
  | "labels";

export function formatIsoDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Une erreur est survenue.";
}

export function normalizeList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}
