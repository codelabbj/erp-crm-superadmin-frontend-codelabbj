import { api } from "./api";

export interface AdminOverview {
  organizations: number;
  users: number;
  active_modules: number;
  active_subscriptions: number;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  is_active: boolean;
  members_count: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  org: { id: string; name: string } | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
}

/** Aligné sur `licensing.Module` + réponse `AdminModulesView`. */
export interface AdminModule {
  id: string;
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
}

/** Aligné sur `licensing.Subscription` + `select_related(org, module)`. */
export interface AdminSubscription {
  id: string;
  status: string;
  billing_cycle: string;
  starts_at: string;
  ends_at: string;
  org: { id: string; name: string };
  module: { id: string; code: string; name: string };
}

export interface PlatformPlanLimits {
  included_seats: number;
  max_users_hard: number;
  additional_seats_allowed: boolean;
}

export interface PlatformPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price_monthly: string | number;
  price_yearly: string | number;
  limits: PlatformPlanLimits;
  enabled_modules: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PlatformPlanUpsert = {
  name: string;
  code: string;
  description?: string;
  price_monthly: string | number;
  price_yearly: string | number;
  limits: PlatformPlanLimits;
  enabled_modules: string[];
  is_active?: boolean;
};

export interface OrganizationSubscriptionOverview {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  is_active?: boolean;
  status?: "active" | "suspended" | "trial" | string;
  plan_code?: string | null;
  seats_used?: number;
  seats_included?: number;
  additional_seats?: number;
  active_modules_count?: number;
}

export interface OrganizationDetail extends OrganizationSubscriptionOverview {
  plan_name?: string | null;
  seats_max_hard?: number;
}

export interface OrganizationSubscriptionItem {
  id: string;
  module: { id: string; code: string; name: string };
  status: string;
  billing_cycle?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  auto_renew?: boolean;
}

export type AssignPlanPayload = {
  plan_id?: string;
  plan_code?: string;
};

export type AddSeatsPayload = {
  seats: number;
};

export type AdminSubscriptionPatchPayload = Partial<
  Pick<OrganizationSubscriptionItem, "status" | "billing_cycle" | "ends_at" | "auto_renew">
>;

export interface SubscriptionStats {
  total_active_organizations?: number;
  plan_distribution?: Record<string, number>;
  total_active_modules?: number;
  total_trial_subscriptions?: number;
  expiring_in_7_days?: number;
  estimated_monthly_revenue?: number | string;
  [key: string]: unknown;
}

export interface SubscriptionAlertItem {
  organization_id?: string;
  organization_name?: string;
  plan_code?: string | null;
  module_code?: string | null;
  ends_at?: string | null;
  [key: string]: unknown;
}

export interface SubscriptionAlerts {
  expired: SubscriptionAlertItem[];
  trial_ending_soon: SubscriptionAlertItem[];
  no_plan: SubscriptionAlertItem[];
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

export interface RoleItem {
  id: string;
  name: string;
  permissions: Record<string, string[]>;
  is_default: boolean;
}

export interface PermissionsSchema {
  modules?: Record<string, string[]>;
  actions?: string[];
  predefined_roles?: Array<{ name: string; permissions: Record<string, string[]> }>;
  [key: string]: unknown;
}

export interface AuditLogItem {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload?: Record<string, unknown>;
  user_email?: string;
}

export interface BillingClientItem {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface BillingInvoiceItem {
  id: string;
  invoice_number: string;
  status?: string;
  invoice_type?: string;
  total?: string;
  issued_at?: string;
  payment_state?: string;
  client?: { id: string; name: string } | string;
}

export interface BillingPaymentItem {
  id: string;
  amount?: string;
  flow?: string;
  method?: string;
  status?: string;
  paid_at?: string;
  created_at?: string;
  invoice_detail?: string;
}

export interface ImportJobItem {
  id: string;
  module_code: string;
  file_path: string;
  file_name?: string;
  status?: string;
  error?: string;
  completed_at?: string | null;
  created_at?: string;
}

export interface ExportJobItem {
  id: string;
  module_code: string;
  format: string;
  status?: string;
  file_path?: string;
  error?: string;
  completed_at?: string | null;
  created_at?: string;
}

export interface AdminDomain {
  id: string;
  tenant_id: string;
  tenant_name: string;
  domain: string;
  status: string;
  cname_target: string;
  dns_verified: boolean;
  certificate_status: "pending" | "valid" | "expired" | "error";
  certificate_expires_at: string;
  created_at?: string;
}

export interface FeatureFlag {
  flag_key: string;
  description: string;
  default_enabled: boolean;
}

export interface FeatureFlagOverride {
  id: string;
  flag_key: string;
  scope: "global" | "tenant";
  tenant_id?: string | null;
  is_enabled: boolean;
}

export interface BannedIP {
  id: string;
  ip_address: string;
  reason: string;
  expires_at: string;
  is_active: boolean;
  created_at?: string;
}

export interface WafRule {
  id: string;
  key: string;
  description: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
}

export type AdminModuleUpdate = {
  id: string;
} & Partial<
  Pick<
    AdminModule,
    | "name"
    | "description"
    | "price_monthly"
    | "price_yearly"
    | "trial_days"
    | "is_active"
    | "sort_order"
  >
>;

export type AdminUserUpdate = {
  id: string;
} & Partial<Pick<AdminUser, "is_active" | "is_staff" | "is_superuser">>;

export type AdminModulePatchPayload = Partial<
  Pick<AdminModule, "name" | "description" | "price_monthly" | "price_yearly" | "trial_days" | "is_active" | "sort_order">
>;

export const adminApi = {
  overview: async () => (await api.get<AdminOverview>("/api/admin/overview/")).data,

  licensingPlans: async () => (await api.get<PlatformPlan[]>("/api/admin/licensing/plans/")).data,
  createLicensingPlan: async (payload: PlatformPlanUpsert) =>
    (await api.post<PlatformPlan>("/api/admin/licensing/plans/", payload)).data,
  updateLicensingPlan: async (id: string, payload: PlatformPlanUpsert) =>
    (await api.put<PlatformPlan>(`/api/admin/licensing/plans/${id}/`, payload)).data,
  patchLicensingPlan: async (id: string, payload: Partial<PlatformPlanUpsert>) =>
    (await api.patch<PlatformPlan>(`/api/admin/licensing/plans/${id}/`, payload)).data,
  toggleLicensingPlanActive: async (id: string, is_active: boolean) =>
    (await api.patch<PlatformPlan>(`/api/admin/licensing/plans/${id}/`, { is_active })).data,
  deleteLicensingPlan: async (id: string) => (await api.delete(`/api/admin/plans/${id}/delete/`)).data,

  licensingModules: async () => (await api.get<AdminModule[]>("/api/admin/licensing/modules/")).data,
  patchLicensingModule: async (id: string, payload: AdminModulePatchPayload) =>
    (await api.patch<AdminModule>(`/api/admin/licensing/modules/${id}/`, payload)).data,

  organizationsOverview: async (params?: { q?: string; plan?: string; status?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<OrganizationSubscriptionOverview>>("/api/admin/organizations/", { params })).data,
  organizationDetail: async (id: string) => (await api.get<OrganizationDetail>(`/api/admin/organizations/${id}/`)).data,
  organizationSubscriptions: async (id: string, params?: { limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<OrganizationSubscriptionItem>>(`/api/admin/organizations/${id}/subscriptions/`, { params })).data,
  assignPlanToOrganization: async (id: string, payload: AssignPlanPayload) =>
    (await api.post(`/api/admin/organizations/${id}/assign-plan/`, payload)).data,
  addSeatsToOrganization: async (id: string, payload: AddSeatsPayload) =>
    (await api.post(`/api/admin/organizations/${id}/add-seats/`, payload)).data,

  patchSubscription: async (id: string, payload: AdminSubscriptionPatchPayload) =>
    (await api.patch(`/api/admin/subscriptions/${id}/`, payload)).data,
  deleteSubscription: async (id: string) => (await api.delete(`/api/admin/subscriptions/${id}/`)).data,
  extendSubscription: async (id: string, payload: { ends_at: string }) =>
    (await api.post(`/api/admin/subscriptions/${id}/extend/`, payload)).data,

  subscriptionStats: async () => (await api.get<SubscriptionStats>("/api/admin/subscriptions/stats/")).data,
  subscriptionExpiringSoon: async () =>
    (await api.get<SubscriptionAlertItem[]>("/api/admin/subscriptions/expiring-soon/")).data,
  subscriptionAlerts: async () => (await api.get<SubscriptionAlerts>("/api/admin/subscriptions/alerts/")).data,

  organizations: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminOrganization>>("/api/admin/organizations/", { params })).data,

  updateOrganization: async (payload: { id: string; is_active: boolean }) =>
    (await api.patch("/api/admin/organizations/", payload)).data,

  users: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminUser>>("/api/admin/users/", { params })).data,

  updateUser: async (payload: AdminUserUpdate) =>
    (await api.patch("/api/admin/users/", payload)).data,

  modules: async (params?: { sort?: string }) =>
    (await api.get<AdminModule[]>("/api/admin/modules/", { params })).data,

  updateModule: async (payload: AdminModuleUpdate) =>
    (await api.patch<AdminModule>("/api/admin/modules/", payload)).data,

  subscriptions: async (params?: {
    status?: string;
    module?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) => (await api.get<PaginatedResponse<AdminSubscription>>("/api/admin/subscriptions/", { params })).data,

  roles: async () => (await api.get<RoleItem[]>("/api/roles/")).data,
  createRole: async (payload: { name: string; permissions?: Record<string, string[]>; is_default?: boolean }) =>
    (await api.post<RoleItem>("/api/roles/", payload)).data,
  permissionsSchema: async () => (await api.get<PermissionsSchema>("/api/permissions-schema/")).data,

  auditLogs: async () => (await api.get<AuditLogItem[]>("/api/audit-logs/")).data,
  billingClients: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<BillingClientItem> | BillingClientItem[]>("/api/billing/clients/", { params })).data,
  billingInvoices: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<BillingInvoiceItem> | BillingInvoiceItem[]>("/api/billing/invoices/", { params })).data,
  billingPayments: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<BillingPaymentItem> | BillingPaymentItem[]>("/api/billing/payments/", { params })).data,

  importJobs: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<ImportJobItem> | ImportJobItem[]>("/api/io/imports/", { params })).data,
  exportJobs: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<ExportJobItem> | ExportJobItem[]>("/api/io/exports/", { params })).data,

  // Domains & SSL
  domains: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminDomain>>("/api/admin/domains/", { params })).data,
  createDomain: async (payload: { tenant_id: string; domain: string; cname_target: string }) =>
    (await api.post<AdminDomain>("/api/admin/domains/", payload)).data,
  domainDetail: async (id: string) => (await api.get<AdminDomain>(`/api/admin/domains/${id}/`)).data,
  verifyDomain: async (id: string) => (await api.post(`/api/admin/domains/${id}/verify/`)).data,
  renewDomainCertificate: async (id: string) => (await api.post(`/api/admin/domains/${id}/renew-certificate/`)).data,

  // Feature Flags
  featureFlags: async () => (await api.get<FeatureFlag[]>("/api/admin/feature-flags/")).data,
  patchFeatureFlag: async (key: string, payload: { description?: string; default_enabled?: boolean }) =>
    (await api.patch<FeatureFlag>(`/api/admin/feature-flags/${key}/`, payload)).data,
  featureFlagOverrides: async () => (await api.get<FeatureFlagOverride[]>("/api/admin/feature-flags/overrides/")).data,
  upsertFeatureFlagOverride: async (payload: { flag_key: string; is_enabled: boolean; tenant_id?: string }) =>
    (await api.post<FeatureFlagOverride>("/api/admin/feature-flags/overrides/", payload)).data,

  // Security (WAF & IP Banning)
  bannedIps: async () => (await api.get<BannedIP[]>("/api/admin/security/banned-ips/")).data,
  banIp: async (payload: { ip_address: string; reason: string; expires_at: string; is_active: boolean }) =>
    (await api.post<BannedIP>("/api/admin/security/banned-ips/", payload)).data,
  unbanIp: async (id: string) => (await api.delete(`/api/admin/security/banned-ips/${id}/`)).data,
  wafRules: async () => (await api.get<WafRule[]>("/api/admin/security/waf-rules/")).data,
  patchWafRule: async (id: string, payload: { is_enabled?: boolean; description?: string; config?: Record<string, unknown> }) =>
    (await api.patch<WafRule>(`/api/admin/security/waf-rules/${id}/`, payload)).data,

  // General
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return (await api.post<{ url: string }>("/api/upload/image/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
};
