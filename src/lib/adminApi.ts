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

export interface OrgOwnerSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  logo_url?: string;
  is_active: boolean;
  members_count: number;
  created_at: string;
  owner?: OrgOwnerSummary | null;
  plan_code?: string | null;
  plan_name?: string | null;
  plan_status?: string | null;
  status?: string | null;
  plan_billing_cycle?: string | null;
  plan_starts_at?: string | null;
  plan_expires_at?: string | null;
  plan_trial_ends_at?: string | null;
  enabled_modules?: string[];
  active_modules_count?: number;
  seats_used?: number;
  seats_included?: number;
  seats_total?: number;
  additional_seats?: number;
  has_pal_payment?: boolean;
  has_magic_payment?: boolean;
  has_any_paid?: boolean;
  payment_source?: "pal" | "magic" | "admin_gifted" | "any_paid" | "unpaid" | string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  org: { id: string; name: string } | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_owner?: boolean;
  is_approved_by_admin?: boolean;
  created_at: string;
}

export interface UserRelatedData {
  success: boolean;
  data: {
    user: AdminUser;
    organizations: any[];
    collaborators: any[];
    subscriptions: {
      available: boolean;
      message: string;
      items: any[];
    };
    products: any[];
    customers: any[];
    orders: any[];
    invoices: any[];
    totals: {
      organizations: number;
      collaborators: number;
      products: number;
      customers: number;
      orders: number;
      invoices: number;
      subscriptions: number;
    };
  };
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
  included_credits?: number;
  list_price_monthly?: number;
  list_price_yearly?: number;
  promo_percent?: number;
  annual_discount_percent?: number;
  promo_label?: string;
  promo_ends_at?: string | null;
  quote_based?: boolean;
  discount?: string;
}

export interface PlanPricing {
  list_price_monthly: string;
  list_price_yearly: string;
  price_monthly: string;
  price_yearly: string;
  promo_percent: number;
  annual_discount_percent: number;
  promo_active: boolean;
  promo_label: string;
  promo_ends_at: string | null;
  monthly_savings: string;
  yearly_savings_vs_list: string;
  yearly_savings_vs_monthly: string;
  annual_equivalent_monthly: string;
  quote_based: boolean;
}

export interface PlatformPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  price_monthly: string | number;
  price_yearly: string | number;
  trial_days?: number;
  pricing?: PlanPricing;
  limits: PlatformPlanLimits;
  enabled_modules: (string | { code: string; name?: string })[];
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
  trial_days?: number;
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
  plan_status?: string;
  plan_code?: string | null;
  plan_name?: string | null;
  plan_expires_at?: string | null;
  plan_starts_at?: string | null;
  plan_billing_cycle?: string | null;
  enabled_modules?: string[];
  seats_used?: number;
  seats_included?: number;
  seats_total?: number;
  additional_seats?: number;
  active_modules_count?: number;
  has_pal_payment?: boolean;
  has_magic_payment?: boolean;
  has_any_paid?: boolean;
  payment_source?: string;
}

export interface OrganizationDetail extends OrganizationSubscriptionOverview {
  plan?: { id: string; code: string; name: string } | null;
  seats_max_hard?: number;
  referred_by_partner?: {
    id: string;
    name: string;
    code: string;
    commission_rate: string;
  } | null;
  referral_code_used?: string;
  referred_at?: string | null;
  allow_demo_payment?: boolean;
  demo_payment_expires_at?: string | null;
  demo_payment_active?: boolean;

  /** Profil enregistré (lecture seule — GET admin detail enrichi). */
  updated_at?: string;
  logo_url?: string;
  signature_url?: string;
  deployment_type?: "platform" | "dedicated" | string | null;
  employee_code?: string;
  legal_form?: string;
  primary_manager_name?: string;
  rccm?: string;
  capital_social?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  currency?: string;
  currency_display?: string;
  show_decimals?: boolean;
  timezone?: string;
  locale?: string;
  tax_id?: string;
  tax_id_label?: string;
  is_vat_registered?: boolean;
  vat_rate?: string | null;
  invoice_mode?: string;
  fiscal_adapter_code?: string;
  fiscal_pos_enabled?: boolean;
  fiscal_invoice_enabled?: boolean;
  billing_allow_line_tax_group_edit?: boolean;
  invoice_footer_message?: string;
  pos_discount_threshold_percent?: string | null;
  auto_accounting?: boolean;
  require_geo_verification?: boolean;
  require_daily_report_before_clock_out?: boolean;
  require_clock_out_before_daily_report?: boolean;
  default_warehouse_id?: string | null;
  payment_settings?: Record<string, unknown>;
  plan_trial_ends_at?: string | null;
  /** Clés PAL masquées côté API. */
  pal_secret_key?: string;
  pal_public_key?: string;
  pal_user_id?: string;
  pal_secret_key_set?: boolean;
  pal_public_key_set?: boolean;
  pal_user_id_set?: boolean;
}

export type OrganizationUpsert = {
  name: string;
  slug: string;
  is_active?: boolean;
};

export interface BusinessInvoiceItem {
  id: string;
  invoice_number: string;
  org_id: string;
  org_name: string;
  status: string;
  deployment_type: "platform" | "dedicated";
  billing_cycle: string;
  included_seats: number;
  amount_total: string;
  currency: string;
  recipient_email: string;
  payment_url: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  bank_transfer?: {
    declared_at?: string;
    customer_note?: string;
    bank_reference?: string;
    proof_url?: string;
    review_status?: "pending_review" | "rejected" | "approved";
    rejection_reason?: string;
  } | null;
  bank_confirmation?: {
    confirmed_at?: string;
    proof_url?: string;
    bank_reference?: string;
  } | null;
}

export interface CreateBusinessInvoicePayload {
  org_id: string;
  recipient_email: string;
  recipient_name?: string;
  deployment_type?: "platform" | "dedicated";
  billing_cycle?: "monthly" | "yearly";
  included_seats?: number;
  amount_total: string;
  send_email?: boolean;
  notes?: string;
  business_plan_request_id?: string;
}

export interface BusinessPlanRequestItem {
  id: string;
  reference: string;
  status: string;
  org_id: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  deployment_type: "platform" | "dedicated";
  billing_cycle: "monthly" | "yearly";
  estimated_seats: number;
  message: string;
  business_invoice_id: string | null;
  invoice_number: string | null;
  created_at: string;
}

export interface AdminNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: {
    request_id?: string;
    org_id?: string;
    reference?: string;
    org_name?: string;
    [key: string]: unknown;
  };
  is_read: boolean;
  created_at: string;
}

export interface DedicatedInstanceItem {
  id: string;
  instance_id: string;
  org_id: string;
  org_name: string;
  customer_name: string;
  host_url: string;
  current_version: string;
  status: string;
  license_expires_at: string | null;
  last_heartbeat_at: string | null;
  has_registry_token: boolean;
  install_kit_sent_at: string | null;
  plan_code: string | null;
  plan_status: string | null;
  created_at: string;
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchase_price: string;
  sale_price: string;
  variants_count: number;
  stock_qty: number;
  org: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

export type AdminProductUpdate = {
  name?: string;
  sku?: string;
  description?: string;
  unit?: string;
  sale_price?: string;
  purchase_price?: string;
};

export interface AdminProductsListResponse extends PaginatedResponse<AdminProduct> {
  categories: string[];
}

export interface OrganizationRelatedData {
  success: boolean;
  data: {
    organization: AdminOrganization & {
      email?: string;
      phone?: string;
      slug?: string;
      country?: string;
      currency?: string;
      logo_url?: string;
    };
    owner?: AdminUser | null;
    users: AdminUser[];
    customers: any[];
    products: any[];
    orders: any[];
    invoices: any[];
    totals: {
      users: number;
      customers: number;
      products: number;
      orders: number;
      invoices: number;
    };
  };
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

export type PlanDowngradeMember = {
  id: string;
  email: string;
  full_name: string;
  is_owner: boolean;
  access_status: string;
};

export type PlanDowngradeSelection = {
  code?: "PLAN_DOWNGRADE_SEAT_SELECTION";
  message?: string;
  seats_total: number;
  active_members: number;
  owner_id: string | null;
  members: PlanDowngradeMember[];
  is_downgrade?: boolean;
};

export type ExtendPlanPayload = {
  admin_notes: string;
  extend_days?: number;
  new_end_date?: string;
};

export type AssignPlanPayload = {
  plan_id: string;
  admin_notes: string;
  billing_cycle?: "monthly" | "yearly";
  trial?: boolean;
  retained_user_ids?: string[];
};

export type AddSeatsPayload = {
  quantity: number;
};

export type CreditRates = {
  email_credits_per_send: number;
  whatsapp_credits_per_message: number;
  sms_credits_per_message: number;
  ai_weighted_tokens_per_credit: number;
  ai_output_token_weight: number;
};

export type PlanCreditPolicy = {
  included_credits_plan: number;
  included_credits_override: number | null;
  included_credits_effective: number;
  plan_code: string | null;
};

export type OrgCreditsLedgerEntry = {
  id: string;
  delta: number;
  balance_after: number;
  channel: string;
  credits_charged: number;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by_email?: string | null;
};

export type OrgCreditsPayload = {
  credits_balance: number;
  credits_rates: CreditRates;
  credits_low_balance: boolean;
  credits_low_balance_threshold?: number | null;
  credits_plan_policy?: PlanCreditPolicy;
  plan_credit_policy?: PlanCreditPolicy;
  effective_rates?: CreditRates;
  rate_overrides?: Partial<CreditRates> & {
    low_balance_threshold?: number | null;
    included_credits_override?: number | null;
  };
  ledger?: { count: number; results: OrgCreditsLedgerEntry[] };
};

export type PatchOrgCreditsPayload = Partial<CreditRates> & {
  low_balance_threshold?: number;
  included_credits_override?: number;
  clear_fields?: string[];
};

export type GrantOrgCreditsPayload = {
  amount: number;
  reason?: string;
};

export type CreditCatalogPack = {
  code: string;
  label: string;
  credits: number;
  price_xof: number;
  unit_price_xof: number;
  is_active: boolean;
  sort_order: number;
};

export type CreditCatalogPayload = {
  unit_price_xof: number;
  purchase_enabled: boolean;
  packs: CreditCatalogPack[];
};

export type PatchCreditCatalogPayload = {
  unit_price_xof?: number;
  purchase_enabled?: boolean;
  packs?: Array<{
    code: string;
    label: string;
    credits: number;
    price_xof?: number | null;
    is_active?: boolean;
    sort_order?: number;
  }>;
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
  user_name?: string;
}

export interface PaymentTransactionItem {
  transaction_id: string;
  external_reference: string;
  provider_ref?: string | null;
  tenant_id: string;
  organization_name?: string | null;
  purpose: string;
  direction: string;
  amount: number;
  currency: string;
  status: string;
  operator?: string | null;
  phone?: string | null;
  country_code?: string | null;
  callback_url: string;
  metadata?: Record<string, unknown>;
  pal_response?: Record<string, unknown> | null;
  webhook_payload?: Record<string, unknown> | null;
  callback_dispatched: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
}

export interface AdminPartnerItem {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_rate: string;
  country: string;
  status: string;
  notes: string;
  referral_link: string;
  clients_count: number;
  available_balance: string;
  account_email?: string | null;
  created_at: string;
}

export interface AdminPartnerCreatePayload {
  name: string;
  code: string;
  email?: string;
  commission_rate?: string | number;
  country?: string;
  notes?: string;
  account_email?: string;
  account_password?: string;
  status?: string;
}

export interface AdminPartnerClientItem {
  id: string;
  name: string;
  referred_at: string | null;
  referral_code_used: string;
  plan_status: string;
  plan_code: string | null;
  commission_amount: string | null;
  commission_status: string | null;
}

export interface AdminPartnerCommissionItem {
  id: string;
  organization_id: string;
  organization_name: string;
  source_type: string;
  payment_amount: string;
  commission_rate: string;
  commission_amount: string;
  status: string;
  created_at: string;
}

export interface AdminPartnerWithdrawalItem {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  amount: string;
  status: string;
  momo_country_code: string;
  momo_operator: string;
  momo_phone: string;
  admin_notes: string;
  created_at: string;
  processed_at: string | null;
}

export interface AdminPartnerApplicationItem {
  id: string;
  reference: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  country: string;
  preferred_code: string;
  message: string;
  admin_notes: string;
  partner_id: string | null;
  partner_code: string | null;
  created_at: string;
  processed_at: string | null;
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

export interface PdfToolCatalogItem {
  code: string;
  label: string;
  is_premium: boolean;
  default_is_premium: boolean;
  is_overridden: boolean;
}

export interface PdfToolsCatalogResponse {
  tools: PdfToolCatalogItem[];
  premium_count: number;
  free_count: number;
}

export interface PdfToolUsageToolRow {
  code: string;
  label: string;
  is_premium: boolean;
  runs: number;
  done: number;
  failed: number;
  input_files: number;
  output_files: number;
  input_bytes: number;
  output_bytes: number;
  client_runs: number;
  server_runs: number;
  unique_users: number;
  unique_clients: number;
  unique_anonymous: number;
}

export interface PdfToolsUsageResponse {
  period: string;
  totals: Omit<PdfToolUsageToolRow, "code" | "label" | "is_premium">;
  tools: PdfToolUsageToolRow[];
  daily: { day: string | null; runs: number; input_bytes: number; unique_users: number }[];
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
  active_plans?: number;
  paying_tenants?: number;
  revenue_30d?: number;
  revenue_365d?: number;
  revenue_source?: string;
  churn_rate: number;
  net_revenue_retention: number;
  trial_to_paid_rate: number;
  by_plan?: Array<{ plan_code: string; count: number }>;
  time_series: {
    new_tenants_by_month: Array<{ month: string; count: number }>;
    new_subscriptions_by_month?: Array<{ month: string; count: number }>;
    new_plans_by_month?: Array<{ month: string; count: number }>;
    cancelled_subscriptions_by_month?: Array<{ month: string; count: number }>;
    expired_plans_by_month?: Array<{ month: string; count: number }>;
    revenue_by_month?: Array<{ month: string; amount: number }>;
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

export interface AIModel {
  id: string;
  created: number;
  owned_by: string;
}

export interface AIAssistantConfig {
  models: AIModel[];
  config: {
    chat: string;
    code: string;
    rag: string;
  };
}

export interface AIAssistantResponse {
  response: string;
  mode: string;
}

export interface AIAssistantPayload {
  prompt: string;
  model_id?: string;
  context?: Record<string, any>;
}

export interface AIConversation {
  id: string;
  org: string;
  user: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  updated_at: string;
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
} & Partial<Pick<AdminUser, "is_active" | "is_staff" | "is_superuser" | "is_approved_by_admin">>;

export type AdminModulePatchPayload = Partial<
  Pick<AdminModule, "name" | "description" | "price_monthly" | "price_yearly" | "trial_days" | "is_active" | "sort_order">
>;

export const adminApi = {
  overview: async () => (await api.get<AdminOverview>("/api/admin/overview/")).data,

  licensingPlans: async () => {
    const { data } = await api.get<PlatformPlan[] | { results?: PlatformPlan[] }>("/api/licensing/plans/");
    return Array.isArray(data) ? data : (data.results ?? []);
  },
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

  organizationsOverview: async (params?: {
    q?: string;
    plan?: string;
    status?: string;
    subscription_status?: string;
    payment_source?: string;
    expiring_days?: number;
    is_active?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) =>
    (await api.get<PaginatedResponse<OrganizationSubscriptionOverview>>("/api/admin/organizations/", { params })).data,
  organizationDetail: async (id: string) => {
    const data = (await api.get<OrganizationDetail>(`/api/admin/organizations/${id}/`)).data;
    return {
      ...data,
      plan_code: data.plan_code ?? data.plan?.code ?? null,
      plan_name: data.plan_name ?? data.plan?.name ?? null,
      status: data.status ?? data.plan_status ?? undefined,
    };
  },
  patchOrganizationDemoPayment: async (
    id: string,
    payload: { allow_demo_payment: boolean; demo_payment_expires_at?: string | null },
  ) =>
    (
      await api.patch<{
        id: string;
        allow_demo_payment: boolean;
        demo_payment_expires_at: string | null;
        demo_payment_active: boolean;
      }>(`/api/admin/organizations/${id}/`, payload)
    ).data,
  organizationRelatedData: async (id: string) =>
    (await api.get<OrganizationRelatedData>(`/api/admin/organizations/${id}/related/`)).data,
  organizationSubscriptions: async (id: string, params?: { limit?: number; offset?: number; sort?: string }) => {
    const data = await api.get<
      PaginatedResponse<OrganizationSubscriptionItem> & {
        subscriptions?: OrganizationSubscriptionItem[];
      }
    >(`/api/admin/organizations/${id}/subscriptions/`, { params });
    const results = data.data.results ?? data.data.subscriptions ?? [];
    return { ...data.data, count: data.data.count ?? results.length, results };
  },
  assignPlanToOrganization: async (id: string, payload: AssignPlanPayload) =>
    (await api.post(`/api/admin/organizations/${id}/assign-plan/`, payload)).data,
  extendOrganizationPlan: async (id: string, payload: ExtendPlanPayload) =>
    (await api.post(`/api/admin/organizations/${id}/extend-plan/`, payload)).data,
  addSeatsToOrganization: async (id: string, payload: AddSeatsPayload) =>
    (await api.post(`/api/admin/organizations/${id}/add-seats/`, payload)).data,
  organizationCredits: async (id: string, params?: { limit?: number; offset?: number; channel?: string }) =>
    (await api.get<OrgCreditsPayload>(`/api/admin/organizations/${id}/credits/`, { params })).data,
  patchOrganizationCredits: async (id: string, payload: PatchOrgCreditsPayload) =>
    (await api.patch<OrgCreditsPayload>(`/api/admin/organizations/${id}/credits/`, payload)).data,
  grantOrganizationCredits: async (id: string, payload: GrantOrgCreditsPayload) =>
    (await api.post<OrgCreditsPayload>(`/api/admin/organizations/${id}/credits/grant/`, payload)).data,

  creditCatalog: async () =>
    (await api.get<CreditCatalogPayload>("/api/admin/credits/catalog/")).data,
  patchCreditCatalog: async (payload: PatchCreditCatalogPayload) =>
    (await api.patch<CreditCatalogPayload>("/api/admin/credits/catalog/", payload)).data,

  patchSubscription: async (id: string, payload: AdminSubscriptionPatchPayload) =>
    (await api.patch(`/api/admin/subscriptions/${id}/`, payload)).data,
  deleteSubscription: async (id: string) => (await api.delete(`/api/admin/subscriptions/${id}/`)).data,
  extendSubscription: async (id: string, payload: { new_end_date?: string; extend_days?: number }) =>
    (await api.post(`/api/admin/subscriptions/${id}/extend/`, payload)).data,

  subscriptionStats: async () => (await api.get<SubscriptionStats>("/api/admin/subscriptions/stats/")).data,
  subscriptionExpiringSoon: async (params?: { days?: number }) =>
    (await api.get<PaginatedResponse<AdminSubscription>>("/api/admin/subscriptions/expiring-soon/", { params })).data,
  subscriptionAlerts: async () => (await api.get<SubscriptionAlerts>("/api/admin/subscriptions/alerts/")).data,

  organizations: async (params?: {
    q?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    plan?: string;
    status?: string;
    subscription_status?: string;
    payment_source?: string;
    expiring_days?: number;
    is_active?: string;
  }) =>
    (await api.get<PaginatedResponse<AdminOrganization>>("/api/admin/organizations/", { params })).data,

  updateOrganization: async (payload: { id: string; is_active: boolean }) =>
    (await api.patch("/api/admin/organizations/", payload)).data,
  createOrganization: async (payload: OrganizationUpsert) =>
    (await api.post<AdminOrganization>("/api/admin/organizations/", payload)).data,

  users: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminUser>>("/api/admin/users/", { params })).data,
  userRelatedData: async (id: string) =>
    (await api.get<UserRelatedData>(`/api/admin/users/${id}/related/`)).data,
  updateUser: async (payload: AdminUserUpdate) =>
    (await api.patch("/api/admin/users/", payload)).data,

  products: async (params?: {
    q?: string;
    org_id?: string;
    category?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) => (await api.get<AdminProductsListResponse>("/api/admin/products/", { params })).data,

  productDetail: async (id: string) =>
    (await api.get<AdminProduct>(`/api/admin/products/${id}/`)).data,

  updateProduct: async (id: string, payload: AdminProductUpdate) =>
    (await api.patch<AdminProduct>(`/api/admin/products/${id}/`, payload)).data,

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

  auditLogs: async (params?: { q?: string; action?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AuditLogItem>>("/api/audit-logs/", { params })).data,
  organizationAuditLogs: async (
    orgId: string,
    params?: { q?: string; action?: string; limit?: number; offset?: number; sort?: string },
  ) =>
    (await api.get<PaginatedResponse<AuditLogItem>>(`/api/admin/organizations/${orgId}/audit-logs/`, { params }))
      .data,

  paymentTransactions: async (params?: {
    q?: string;
    status?: string;
    purpose?: string;
    direction?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) =>
    (await api.get<PaginatedResponse<PaymentTransactionItem>>("/api/admin/payment-transactions/", { params })).data,

  organizationPaymentTransactions: async (
    orgId: string,
    params?: {
      q?: string;
      status?: string;
      purpose?: string;
      direction?: string;
      limit?: number;
      offset?: number;
      sort?: string;
    },
  ) =>
    (
      await api.get<PaginatedResponse<PaymentTransactionItem>>(
        `/api/admin/organizations/${orgId}/payment-transactions/`,
        { params },
      )
    ).data,

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

  pdfToolsCatalog: async () =>
    (await api.get<PdfToolsCatalogResponse>("/api/admin/pdf-tools/")).data,
  patchPdfToolCatalog: async (code: string, payload: { is_premium: boolean }) =>
    (await api.patch<PdfToolCatalogItem>(`/api/admin/pdf-tools/${code}/`, payload)).data,
  resetPdfToolCatalog: async (code: string) =>
    (await api.post<PdfToolCatalogItem>(`/api/admin/pdf-tools/${code}/reset/`)).data,
  pdfToolsUsage: async (period = "30d") =>
    (await api.get<PdfToolsUsageResponse>("/api/admin/pdf-tools/usage/", { params: { period } })).data,

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

  // Factures Business (abonnement commercial)
  businessInvoices: async (params?: {
    status?: string;
    org_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    (
      await api.get<PaginatedResponse<BusinessInvoiceItem>>("/api/admin/business-invoices/", {
        params,
      })
    ).data,
  createBusinessInvoice: async (payload: CreateBusinessInvoicePayload) =>
    (await api.post<BusinessInvoiceItem>("/api/admin/business-invoices/", payload)).data,
  sendBusinessInvoice: async (id: string) =>
    (await api.post<BusinessInvoiceItem>(`/api/admin/business-invoices/${id}/send/`)).data,
  cancelBusinessInvoice: async (id: string) =>
    (await api.post<BusinessInvoiceItem>(`/api/admin/business-invoices/${id}/cancel/`)).data,

  confirmBusinessInvoiceBankPayment: async (
    id: string,
    payload: { proof?: File; bank_reference?: string; admin_notes?: string },
  ) => {
    const formData = new FormData();
    if (payload.proof) formData.append("proof", payload.proof);
    if (payload.bank_reference) formData.append("bank_reference", payload.bank_reference);
    if (payload.admin_notes) formData.append("admin_notes", payload.admin_notes);
    return (
      await api.post<BusinessInvoiceItem>(
        `/api/admin/business-invoices/${id}/confirm-bank-payment/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
    ).data;
  },

  rejectBusinessInvoiceBankPayment: async (
    id: string,
    payload: { admin_notes?: string },
  ) =>
    (
      await api.post<BusinessInvoiceItem>(
        `/api/admin/business-invoices/${id}/reject-bank-payment/`,
        payload,
      )
    ).data,

  businessPlanRequests: async (params?: {
    org_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    (
      await api.get<PaginatedResponse<BusinessPlanRequestItem>>(
        "/api/admin/business-plan-requests/",
        { params },
      )
    ).data,

  updateBusinessPlanRequest: async (
    id: string,
    payload: { status?: string; admin_notes?: string },
  ) =>
    (
      await api.patch<BusinessPlanRequestItem>(`/api/admin/business-plan-requests/${id}/`, payload)
    ).data,

  notifications: async (params?: { unread?: boolean | number; limit?: number; offset?: number }) =>
    (
      await api.get<PaginatedResponse<AdminNotificationItem>>("/api/admin/notifications/", {
        params: {
          ...params,
          unread: params?.unread ? 1 : undefined,
        },
      })
    ).data,

  notificationsUnreadCount: async () =>
    (await api.get<{ count: number }>("/api/admin/notifications/unread-count/")).data,

  markNotificationsRead: async (payload: { ids?: string[]; all?: boolean }) =>
    (await api.post<{ marked: number }>("/api/admin/notifications/mark-read/", payload)).data,

  dedicatedInstances: async (params?: { status?: string; limit?: number; offset?: number }) =>
    (
      await api.get<PaginatedResponse<DedicatedInstanceItem>>("/api/admin/dedicated-instances/", {
        params,
      })
    ).data,
  sendDedicatedInstallKit: async (instanceId: string) =>
    (await api.post<{ detail: string }>(`/api/admin/dedicated-instances/${instanceId}/send-install-kit/`))
      .data,
  issueDedicatedLicense: async (instanceId: string) =>
    (
      await api.post<{ license: Record<string, unknown> }>(
        `/api/admin/dedicated-instances/${instanceId}/issue-license/`,
      )
    ).data,

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
  updateSupportTicket: async (id: string, payload: Partial<{ status: string; priority: string; notes: string }>) =>
    (await api.patch(`/api/support/tickets/${id}/`, payload)).data,

  // Projects
  projects: async () => (await api.get<PaginatedResponse<ProjectItem>>("/api/projects/projects/")).data,
  createProject: async (payload: { name: string; status: string; description?: string }) =>
    (await api.post("/api/projects/projects/", payload)).data,

  // E-commerce
  ecommerceOrders: async () => (await api.get<PaginatedResponse<EcommerceOrder>>("/api/ecommerce/orders/")).data,
  ecommerceStorefronts: async () => (await api.get<any[]>("/api/ecommerce/storefronts/")).data,
  updateEcommerceOrder: async (id: string, payload: { status: string }) =>
    (await api.patch(`/api/ecommerce/orders/${id}/`, payload)).data,

  // Fiscal
  fiscalConfigs: async () => (await api.get<any[]>("/api/fiscal/config/")).data,
  createFiscalConfig: async (payload: { name: string; regime: string; tax_rate: number; country: string; is_active: boolean }) =>
    (await api.post("/api/fiscal/config/", payload)).data,
  updateFiscalConfig: async (id: string, payload: Partial<{ name: string; regime: string; tax_rate: number; is_active: boolean }>) =>
    (await api.patch(`/api/fiscal/config/${id}/`, payload)).data,
  generateFiscalReport: async (payload: { year: number; type: string }) =>
    (await api.post("/api/fiscal/reports/generate/", payload)).data,

  // Labels
  labelTemplates: async () => (await api.get<any[]>("/api/labels/templates/")).data,
  createLabelTemplate: async (payload: { name: string; dimensions: string; format: string; content?: string }) =>
    (await api.post("/api/labels/templates/", payload)).data,
  generateLabel: async (payload: any) => (await api.post("/api/labels/", payload)).data,
  printLabel: async (payload: { template_id: string; data: Record<string, string>; copies: number }) =>
    (await api.post("/api/labels/print/", payload)).data,

  // General
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return (await api.post<{ url: string }>("/api/upload/image/", formData)).data;
  },

  // Assistant IA
  aiModels: async () => (await api.get<AIAssistantConfig>("/api/ai/assistant/models/")).data.models,
  askAssistant: async (payload: AIAssistantPayload) => 
    (await api.post<AIAssistantResponse>("/api/ai/assistant/ask/", payload)).data,

  partnerProgramSettings: async () =>
    (await api.get<PartnerProgramSettings>("/api/admin/partners/program/")).data,
  updatePartnerProgramSettings: async (payload: Partial<PartnerProgramSettings>) =>
    (await api.patch<PartnerProgramSettings>("/api/admin/partners/program/", payload)).data,
  partners: async (params?: { q?: string }) =>
    (await api.get<PaginatedResponse<AdminPartnerItem>>("/api/admin/partners/", { params })).data,
  updatePartner: async (id: string, payload: Partial<{ status: string; commission_rate: string; notes: string }>) =>
    (await api.patch<AdminPartner>(`/api/admin/partners/${id}/`, payload)).data,
  updatePartnerStatus: async (partnerId: string, status: "active" | "suspended") =>
    (await api.patch<AdminPartnerItem>(`/api/admin/partners/${partnerId}/`, { status })).data,
  partnerClients: async (partnerId: string) =>
    (await api.get<PaginatedResponse<AdminPartnerClientItem>>(`/api/admin/partners/${partnerId}/clients/`)).data,
  partnerCommissions: async (partnerId: string) =>
    (await api.get<PaginatedResponse<AdminPartnerCommissionItem>>(`/api/admin/partners/${partnerId}/commissions/`)).data,
  partnerWithdrawals: async (params?: { status?: string; partner_id?: string }) =>
    (await api.get<PaginatedResponse<AdminPartnerWithdrawalItem>>("/api/admin/partners/withdrawals/", { params }))
      .data,
  partnerWithdrawalAction: async (
    withdrawalId: string,
    payload: { action: "approve" | "reject" | "mark-paid"; admin_notes?: string },
  ) =>
    (await api.post(`/api/admin/partners/withdrawals/${withdrawalId}/action/`, payload)).data,

  productFeedback: async (params?: {
    q?: string;
    status?: string;
    feedback_type?: string;
    feedback_id?: string;
    org_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    (await api.get<PaginatedResponse<ProductFeedbackItem>>("/api/admin/product-feedback/", { params }))
      .data,

  productFeedbackTopReporters: async (params?: { limit?: number }) =>
    (
      await api.get<PaginatedResponse<ProductFeedbackTopReporter>>(
        "/api/admin/product-feedback/top-reporters/",
        { params },
      )
    ).data,

  productFeedbackDetail: async (id: string) =>
    (await api.get<ProductFeedbackItem>(`/api/admin/product-feedback/${id}/`)).data,

  updateProductFeedback: async (
    id: string,
    payload: Partial<{
      status: string;
      admin_notes: string;
      assigned_to_email: string;
      fixed_in_version: string;
    }>,
  ) => (await api.patch<ProductFeedbackItem>(`/api/admin/product-feedback/${id}/`, payload)).data,

  replyProductFeedback: async (id: string, body: string) =>
    (
      await api.post(`/api/admin/product-feedback/${id}/messages/`, { body })
    ).data,

  productBacklog: async (params?: {
    q?: string;
    status?: string;
    horizon?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) =>
    (await api.get<PaginatedResponse<ProductBacklogItem>>("/api/admin/product-backlog/", { params }))
      .data,

  createProductBacklogItem: async (payload: Partial<ProductBacklogItem> & { title: string }) =>
    (await api.post<ProductBacklogItem>("/api/admin/product-backlog/", payload)).data,

  updateProductBacklogItem: async (id: string, payload: Partial<ProductBacklogItem>) =>
    (await api.patch<ProductBacklogItem>(`/api/admin/product-backlog/${id}/`, payload)).data,

  deleteProductBacklogItem: async (id: string) =>
    (await api.delete(`/api/admin/product-backlog/${id}/`)).data,

  blogPosts: async (params?: { q?: string; status?: string; limit?: number; offset?: number }) =>
    (await api.get<PaginatedResponse<BlogPost>>("/api/admin/blog/posts/", { params })).data,

  createBlogPost: async (payload: Partial<BlogPost> & { title: string }) =>
    (await api.post<BlogPost>("/api/admin/blog/posts/", payload)).data,

  updateBlogPost: async (id: string, payload: Partial<BlogPost>) =>
    (await api.patch<BlogPost>(`/api/admin/blog/posts/${id}/`, payload)).data,

  deleteBlogPost: async (id: string) => (await api.delete(`/api/admin/blog/posts/${id}/`)).data,
};

export interface PartnerProgramSettings {
  default_commission_rate: string;
  payout_fee: string;
  min_withdrawal_amount: string;
  updated_at?: string;
}

export interface AdminPartner {
  id: string;
  name: string;
  email: string;
  contact_phone: string;
  code: string;
  commission_rate: string;
  country: string;
  status: string;
  notes: string;
  referral_link: string;
  clients_count: number;
  available_balance: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export interface AdminPartnerWithdrawal {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  amount: string;
  fee_amount: string;
  net_amount: string;
  status: string;
  momo_country_code: string;
  momo_operator: string;
  momo_phone: string;
  pal_reference: string;
  admin_notes: string;
  created_at: string;
  processed_at: string | null;
}

export interface ProductFeedbackMessage {
  id: string;
  body: string;
  author_email: string;
  author_name: string;
  is_staff: boolean;
  created_at: string;
}

export interface ProductFeedbackTopReporter {
  email: string;
  name: string;
  feedback_count: number;
  last_feedback_at: string | null;
}

export interface ProductFeedbackItem {
  id: string;
  reference: string;
  feedback_type: "bug" | "improvement" | "comment";
  status: string;
  title: string;
  description: string;
  reporter_email: string;
  reporter_name: string;
  priority: string;
  context: Record<string, string>;
  screenshot_urls: string[];
  admin_notes: string;
  assigned_to_email: string;
  fixed_in_version: string;
  org: string;
  org_name: string;
  messages?: ProductFeedbackMessage[];
  created_at: string;
  updated_at: string;
}

export interface ProductBacklogItem {
  id: string;
  title: string;
  description: string;
  status: string;
  horizon: string;
  priority: string;
  category: string;
  source_url: string;
  created_by_email: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_url: string;
  body_html: string;
  status: string;
  published_at: string | null;
  author_name: string;
  author_email: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  reading_minutes: number;
  created_at: string;
  updated_at: string;
}

