import { api } from "./api";

export interface AdminOverview {
  organizations: number;
  users: number;
  active_modules: number;
  active_subscriptions: number;
  mrr?: number;
  arr?: number;
  active_orgs?: number;
  total_orgs?: number;
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
  generated_at: string;
  summary: {
    total_active: number;
    total_expired: number;
    total_cancelled: number;
    total_organizations: number;
  };
  by_plan: Array<{ plan_code: string; count: number }>;
  by_module: Array<{ module_code: string; module_name: string; count: number }>;
  monthly_evolution: Array<{ month: string; active_subscriptions: number }>;
}

export interface SubscriptionExpiredItem {
  id: string;
  org: { id: string; name: string };
  module: { code: string; name: string };
  status: string;
  ends_at: string;
  days_expired: number;
}

export interface SubscriptionNoPlanItem {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  days_since_creation: number;
}

export interface SubscriptionAlerts {
  generated_at: string;
  expired: {
    count: number;
    items: SubscriptionExpiredItem[];
  };
  trial_ending_soon: {
    count: number;
    items: any[];
  };
  no_plan: {
    count: number;
    items: SubscriptionNoPlanItem[];
  };
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

export interface PlatformHealthSummary {
  global_uptime_percent: number;
  avg_api_latency_ms: number;
  error_rate_percent: number;
  updated_at: string;
  active_orgs: number;
  total_orgs: number;
  active_users: number;
  total_users: number;
}

export interface PlatformServiceHealth {
  name: string;
  status: "ok" | "degraded" | "down" | string;
  latency_ms: number;
  error_rate: number;
}

export interface PlatformHealthServices {
  services: PlatformServiceHealth[];
  updated_at: string;
}

export interface BusinessMetrics {
  mrr: number;
  arr: number;
  active_tenants: number;
  churn_rate: number;
  net_revenue_retention: number;
  trial_to_paid_rate: number;
  time_series: {
    new_tenants_by_month: Array<{ month: string; count: number }>;
    new_subscriptions_by_month: Array<{ month: string; count: number }>;
    cancelled_subscriptions_by_month: Array<{ month: string; count: number }>;
  };
}

export interface OnboardingJob {
  id: string;
  tenant_id: string;
  tenant_name: string;
  stage: string;
  status: "pending" | "completed" | "failed" | string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ProjectItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface EcommerceOrder {
  id: string;
  order_number: string;
  total: string;
  status: string;
  created_at: string;
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

  licensingPlans: async () => (await api.get<PlatformPlan[]>("/api/licensing/plans/")).data,
  createLicensingPlan: async (payload: PlatformPlanUpsert) =>
    (await api.post<PlatformPlan>("/api/licensing/plans/", payload)).data,
  updateLicensingPlan: async (id: string, payload: PlatformPlanUpsert) =>
    (await api.put<PlatformPlan>(`/api/licensing/plans/${id}/`, payload)).data,
  patchLicensingPlan: async (id: string, payload: Partial<PlatformPlanUpsert>) =>
    (await api.patch<PlatformPlan>(`/api/licensing/plans/${id}/`, payload)).data,
  toggleLicensingPlanActive: async (id: string, is_active: boolean) =>
    (await api.patch<PlatformPlan>(`/api/licensing/plans/${id}/`, { is_active })).data,
  deleteLicensingPlan: async (id: string) => (await api.delete(`/api/plans/${id}/delete/`)).data,

  licensingModules: async () => (await api.get<AdminModule[]>("/api/licensing/modules/")).data,
  patchLicensingModule: async (id: string, payload: AdminModulePatchPayload) =>
    (await api.patch<AdminModule>(`/api/licensing/modules/${id}/`, payload)).data,

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
    (await api.get<SubscriptionExpiredItem[]>("/api/subscriptions/expiring-soon/")).data,
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

  // Platform Health
  platformHealthSummary: async () => (await api.get<PlatformHealthSummary>("/api/admin/platform-health/summary/")).data,
  platformHealthServices: async () => (await api.get<PlatformHealthServices>("/api/admin/platform-health/services/")).data,

  // Business Metrics
  businessMetrics: async (params?: { period?: string }) => (await api.get<BusinessMetrics>("/api/admin/business-metrics/", { params })).data,

  // Onboarding
  onboardingJobs: async (params?: { q?: string; limit?: number; offset?: number; ordering?: string }) =>
    (await api.get<PaginatedResponse<OnboardingJob>>("/api/admin/onboarding-jobs/", { params })).data,
  retryOnboardingJob: async (id: string) => (await api.post<{ id: string; status: string }>(`/api/admin/onboarding-jobs/${id}/retry/`)).data,

  // Billing Actions
  finalizeInvoice: async (id: string, payload: { invoice_type: string }) =>
    (await api.post(`/api/billing/invoices/${id}/finalize/`, payload)).data,
  cancelInvoice: async (id: string) => (await api.post(`/api/billing/invoices/${id}/cancel/`)).data,
  confirmPayment: async (id: string) => (await api.post(`/api/billing/payments/${id}/confirm/`)).data,

  // Data Ops Actions
  retryImport: async (id: string) => (await api.post(`/api/io/imports/${id}/retry/`)).data,
  cancelImport: async (id: string) => (await api.post(`/api/io/imports/${id}/cancel/`)).data,
  retryExport: async (id: string) => (await api.post(`/api/io/exports/${id}/retry/`)).data,
  cancelExport: async (id: string) => (await api.post(`/api/io/exports/${id}/cancel/`)).data,

  // Marketing
  marketingCampaigns: async () => (await api.get<PaginatedResponse<MarketingCampaign>>("/api/marketing/campaigns/")).data,
  createMarketingCampaign: async (payload: any) => (await api.post("/api/marketing/campaigns/", payload)).data,

  // Support
  supportTickets: async () => (await api.get<PaginatedResponse<SupportTicket>>("/api/support/tickets/")).data,
  createSupportTicket: async (payload: any) => (await api.post("/api/support/tickets/", payload)).data,

  // Projects
  projects: async () => (await api.get<PaginatedResponse<ProjectItem>>("/api/projects/projects/")).data,

  // E-commerce
  ecommerceOrders: async () => (await api.get<PaginatedResponse<EcommerceOrder>>("/api/ecommerce/orders/")).data,

  // Fiscal
  fiscalConfigs: async () => (await api.get<any[]>("/api/fiscal/config/")).data,

  // Labels
  labelTemplates: async () => (await api.get<any[]>("/api/labels/templates/")).data,
  generateLabel: async (payload: any) => (await api.post("/api/labels/", payload)).data,

  // General
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return (await api.post<{ url: string }>("/api/upload/image/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
};

