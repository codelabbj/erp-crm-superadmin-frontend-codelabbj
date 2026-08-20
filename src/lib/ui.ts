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
  | "aiAssistant"
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
  if (!error || typeof error !== "object") return "Une erreur est survenue.";

  // Axios-style: error.response.data contains the API body
  const data: unknown = (error as any)?.response?.data ?? (error as any)?.data;

  if (data && typeof data === "object") {
    // { "errors": { "field": ["msg", ...], ... } }
    const errors = (data as any).errors;
    if (errors && typeof errors === "object") {
      const parts: string[] = [];
      for (const [field, msgs] of Object.entries(errors)) {
        const text = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
        parts.push(`${field}: ${text}`);
      }
      if (parts.length) return parts.join(" | ");
    }

    // { "detail": "some message" }
    if (typeof (data as any).detail === "string") {
      return (data as any).detail;
    }

    // { "error": "some message" } — ex. upload image blog / GCS
    if (typeof (data as any).error === "string") {
      return (data as any).error;
    }

    // { "message": "some message" }
    if (typeof (data as any).message === "string") {
      return (data as any).message;
    }

    // { "non_field_errors": ["msg"] }
    const nfe = (data as any).non_field_errors;
    if (Array.isArray(nfe) && nfe.length) return nfe.join(", ");
  }

  // Fallback to error.message (network errors, etc.)
  if (typeof (error as any).message === "string") {
    return (error as any).message;
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
