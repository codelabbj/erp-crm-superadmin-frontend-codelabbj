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

export const adminApi = {
  overview: async () => (await api.get<AdminOverview>("/api/admin/overview/")).data,

  organizations: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminOrganization>>("/api/admin/organizations/", { params })).data,

  updateOrganization: async (payload: { id: string; is_active: boolean }) =>
    (await api.patch("/api/admin/organizations/", payload)).data,

  users: async (params?: { q?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminUser>>("/api/admin/users/", { params })).data,

  updateUser: async (payload: { id: string; is_active: boolean }) =>
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
};
