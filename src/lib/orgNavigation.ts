/** Contexte organisation : filtre les pages admin et permet le retour vers la fiche org. */
export const ORG_QUERY_KEY = "org";
export const ORG_ACTION_KEY = "action";

export type OrgScopedAction = "assign-plan";

export type OrgDetailTab = "overview" | "subscriptions" | "team" | "billing" | "deployment";

export function orgDetailPath(orgId: string, tab?: OrgDetailTab) {
  const base = `/organizations/${orgId}`;
  if (!tab || tab === "overview") return base;
  return `${base}?tab=${tab}`;
}

export function orgSubscriptionsPath(orgId: string, action?: OrgScopedAction) {
  const params = new URLSearchParams({ [ORG_QUERY_KEY]: orgId });
  if (action) params.set(ORG_ACTION_KEY, action);
  return `/subscriptions?${params.toString()}`;
}

export function orgAuditLogsPath(orgId: string) {
  return `/security/audit-logs?${ORG_QUERY_KEY}=${orgId}`;
}

export function orgBusinessInvoicesPath(orgId: string) {
  return `/billing/business-invoices?${ORG_QUERY_KEY}=${orgId}`;
}

export function readOrgIdFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get(ORG_QUERY_KEY)?.trim();
  return id || null;
}

export function readOrgActionFromSearch(search: string): OrgScopedAction | null {
  const action = new URLSearchParams(search).get(ORG_ACTION_KEY)?.trim();
  return action === "assign-plan" ? action : null;
}

export function readOrgDetailTab(search: string): OrgDetailTab {
  const tab = new URLSearchParams(search).get("tab")?.trim() as OrgDetailTab | undefined;
  const allowed: OrgDetailTab[] = ["overview", "subscriptions", "team", "billing", "deployment"];
  return tab && allowed.includes(tab) ? tab : "overview";
}
