import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, put, patch, del } = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn().mockResolvedValue({ data: {} }),
  del: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("./api", () => ({
  api: { get, post, put, patch, delete: del },
}));

import { adminApi } from "./adminApi";

const planUpsert = {
  name: "P",
  code: "p",
  description: "",
  price_monthly: 1,
  price_yearly: 10,
  trial_days: 7,
  limits: { included_seats: 1, max_users_hard: 2, additional_seats_allowed: false },
  enabled_modules: [] as string[],
};

beforeEach(() => {
  get.mockClear();
  post.mockClear();
  put.mockClear();
  patch.mockClear();
  del.mockClear();
  get.mockResolvedValue({ data: {} });
  post.mockResolvedValue({ data: {} });
  put.mockResolvedValue({ data: {} });
  patch.mockResolvedValue({ data: {} });
  del.mockResolvedValue({ data: {} });
});

describe("adminApi", () => {
  it("overview", async () => {
    await adminApi.overview();
    expect(get).toHaveBeenCalledWith("/api/admin/overview/");
  });

  it("licensing plans CRUD", async () => {
    await adminApi.licensingPlans();
    expect(get).toHaveBeenCalledWith("/api/licensing/plans/");

    await adminApi.createLicensingPlan(planUpsert);
    expect(post).toHaveBeenCalledWith("/api/licensing/plans/", planUpsert);

    await adminApi.updateLicensingPlan("pid", planUpsert);
    expect(put).toHaveBeenCalledWith("/api/licensing/plans/pid/", planUpsert);

    await adminApi.patchLicensingPlan("pid", { is_active: false });
    expect(patch).toHaveBeenCalledWith("/api/licensing/plans/pid/", { is_active: false });

    await adminApi.toggleLicensingPlanActive("pid", true);
    expect(patch).toHaveBeenCalledWith("/api/licensing/plans/pid/", { is_active: true });

    await adminApi.deleteLicensingPlan("pid");
    expect(del).toHaveBeenCalledWith("/api/plans/pid/delete/");
  });

  it("licensing modules", async () => {
    await adminApi.licensingModules();
    expect(get).toHaveBeenCalledWith("/api/licensing/modules/");

    await adminApi.patchLicensingModule("mid", { name: "M" });
    expect(patch).toHaveBeenCalledWith("/api/licensing/modules/mid/", { name: "M" });
  });

  it("organizations (overview, detail, subscriptions, plan, seats)", async () => {
    await adminApi.organizationsOverview({ q: "x", plan: "pro", status: "active", limit: 10, offset: 0, sort: "-created_at" });
    expect(get).toHaveBeenCalledWith("/api/admin/organizations/", {
      params: { q: "x", plan: "pro", status: "active", limit: 10, offset: 0, sort: "-created_at" },
    });

    await adminApi.organizationDetail("oid");
    expect(get).toHaveBeenCalledWith("/api/admin/organizations/oid/");

    await adminApi.organizationSubscriptions("oid", { limit: 5, offset: 0, sort: "-starts_at" });
    expect(get).toHaveBeenCalledWith("/api/admin/organizations/oid/subscriptions/", {
      params: { limit: 5, offset: 0, sort: "-starts_at" },
    });

    await adminApi.assignPlanToOrganization("oid", {
      plan_id: "pro-id",
      admin_notes: "Test assignation",
      billing_cycle: "yearly",
    });
    expect(post).toHaveBeenCalledWith("/api/admin/organizations/oid/assign-plan/", {
      plan_id: "pro-id",
      admin_notes: "Test assignation",
      billing_cycle: "yearly",
    });

    await adminApi.addSeatsToOrganization("oid", { quantity: 2 });
    expect(post).toHaveBeenCalledWith("/api/admin/organizations/oid/add-seats/", { quantity: 2 });
  });

  it("subscriptions (patch, delete, extend)", async () => {
    await adminApi.patchSubscription("sid", { status: "active" });
    expect(patch).toHaveBeenCalledWith("/api/admin/subscriptions/sid/", { status: "active" });

    await adminApi.deleteSubscription("sid");
    expect(del).toHaveBeenCalledWith("/api/admin/subscriptions/sid/");

    await adminApi.extendSubscription("sid", { new_end_date: "2026-12-31" });
    expect(post).toHaveBeenCalledWith("/api/admin/subscriptions/sid/extend/", { new_end_date: "2026-12-31" });
  });

  it("subscription stats & alerts", async () => {
    await adminApi.subscriptionStats();
    expect(get).toHaveBeenCalledWith("/api/admin/subscriptions/stats/");

    await adminApi.subscriptionExpiringSoon();
    expect(get).toHaveBeenCalledWith("/api/admin/subscriptions/expiring-soon/", { params: undefined });

    await adminApi.subscriptionAlerts();
    expect(get).toHaveBeenCalledWith("/api/admin/subscriptions/alerts/");
  });

  it("relationship data and AI assistant", async () => {
    await adminApi.organizationRelatedData("org123");
    expect(get).toHaveBeenCalledWith("/api/admin/organizations/org123/related/");

    await adminApi.userRelatedData("user456");
    expect(get).toHaveBeenCalledWith("/api/admin/users/user456/related/");

    await adminApi.aiModels();
    expect(get).toHaveBeenCalledWith("/api/ai/assistant/models/");

    await adminApi.askAssistant({ prompt: "Hello?", model_id: "m1" });
    expect(post).toHaveBeenCalledWith("/api/ai/assistant/ask/", { prompt: "Hello?", model_id: "m1" });
  });

  it("legacy organizations, users, modules, subs list", async () => {
    await adminApi.organizations({ q: "a", limit: 20, offset: 0, sort: "name" });
    expect(get).toHaveBeenCalledWith("/api/admin/organizations/", { params: { q: "a", limit: 20, offset: 0, sort: "name" } });

    await adminApi.updateOrganization({ id: "o1", is_active: true });
    expect(patch).toHaveBeenCalledWith("/api/admin/organizations/", { id: "o1", is_active: true });

    await adminApi.users({ limit: 10 });
    expect(get).toHaveBeenCalledWith("/api/admin/users/", { params: { limit: 10 } });

    await adminApi.updateUser({ id: "u1", is_active: true });
    expect(patch).toHaveBeenCalledWith("/api/admin/users/", { id: "u1", is_active: true });

    await adminApi.modules({ sort: "sort_order" });
    expect(get).toHaveBeenCalledWith("/api/admin/modules/", { params: { sort: "sort_order" } });

    await adminApi.updateModule({ id: "m1", name: "CRM" });
    expect(patch).toHaveBeenCalledWith("/api/admin/modules/", { id: "m1", name: "CRM" });

    await adminApi.subscriptions({ status: "active", module: "crm", limit: 30, offset: 0, sort: "-created_at" });
    expect(get).toHaveBeenCalledWith("/api/admin/subscriptions/", { params: { status: "active", module: "crm", limit: 30, offset: 0, sort: "-created_at" } });
  });

  it("roles & permissions", async () => {
    await adminApi.roles();
    expect(get).toHaveBeenCalledWith("/api/roles/");

    await adminApi.createRole({ name: "R", is_default: false });
    expect(post).toHaveBeenCalledWith("/api/roles/", { name: "R", is_default: false });

    await adminApi.permissionsSchema();
    expect(get).toHaveBeenCalledWith("/api/permissions-schema/");
  });

  it("audit", async () => {
    await adminApi.auditLogs();
    expect(get).toHaveBeenCalledWith("/api/audit-logs/");
  });

  it("billing", async () => {
    await adminApi.billingClients({ q: "a", limit: 10, offset: 0, sort: "name" });
    expect(get).toHaveBeenCalledWith("/api/billing/clients/", { params: { q: "a", limit: 10, offset: 0, sort: "name" } });

    await adminApi.billingInvoices({ q: "inv", limit: 5, offset: 0, sort: "-issued_at" });
    expect(get).toHaveBeenCalledWith("/api/billing/invoices/", { params: { q: "inv", limit: 5, offset: 0, sort: "-issued_at" } });

    await adminApi.billingPayments();
    expect(get).toHaveBeenCalledWith("/api/billing/payments/", { params: undefined });
  });

  it("import / export jobs", async () => {
    await adminApi.importJobs({ limit: 5 });
    expect(get).toHaveBeenCalledWith("/api/io/imports/", { params: { limit: 5 } });

    await adminApi.exportJobs();
    expect(get).toHaveBeenCalledWith("/api/io/exports/", { params: undefined });
  });
});
