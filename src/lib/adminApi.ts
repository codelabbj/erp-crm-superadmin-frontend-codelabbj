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
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  org: { id: string; name: string } | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AdminModule {
  id: string;
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  trial_days: number;
  is_active: boolean;
}

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
  modules: async (params?: { sort?: string }) => (await api.get<AdminModule[]>("/api/admin/modules/", { params })).data,
  updateModule: async (payload: Partial<AdminModule> & { id: string }) =>
    (await api.patch<AdminModule>("/api/admin/modules/", payload)).data,
  subscriptions: async (params?: { status?: string; module?: string; limit?: number; offset?: number; sort?: string }) =>
    (await api.get<PaginatedResponse<AdminSubscription>>("/api/admin/subscriptions/", { params })).data,
};
