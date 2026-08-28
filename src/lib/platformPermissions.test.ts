import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  hasPerm,
  PATH_PERMISSION,
  PERM,
  resolvePlatformPerms,
  ROLE_PERMS,
} from "./platformPermissions";

describe("platformPermissions", () => {
  it("hasPerm checks membership", () => {
    expect(hasPerm(["orgs.read", "staff.manage"], PERM.STAFF_MANAGE)).toBe(true);
    expect(hasPerm(["orgs.read"], PERM.STAFF_MANAGE)).toBe(false);
    expect(hasPerm(undefined, PERM.STAFF_MANAGE)).toBe(false);
  });

  it("maps sensitive paths", () => {
    expect(PATH_PERMISSION["/platform/team"]).toBe(PERM.STAFF_MANAGE);
    expect(PATH_PERMISSION["/plans"]).toBe(PERM.PLANS_WRITE);
    expect(PATH_PERMISSION["/billing/business-invoices"]).toBe(PERM.BILLING_WRITE);
  });

  it("role matrix smoke: viewer cannot mutate money/plans/staff", () => {
    const viewer = ROLE_PERMS.viewer;
    expect(hasPerm(viewer, PERM.ORGS_READ)).toBe(true);
    expect(hasPerm(viewer, PERM.ORGS_WRITE)).toBe(false);
    expect(hasPerm(viewer, PERM.BILLING_WRITE)).toBe(false);
    expect(hasPerm(viewer, PERM.PLANS_WRITE)).toBe(false);
    expect(hasPerm(viewer, PERM.STAFF_MANAGE)).toBe(false);
    expect(canAccessPath([...viewer], "/plans")).toBe(false);
    expect(canAccessPath([...viewer], "/platform/team")).toBe(false);
    expect(canAccessPath([...viewer], "/organizations")).toBe(true);
  });

  it("role matrix smoke: ops can orgs+billing but not plans/staff", () => {
    const ops = ROLE_PERMS.ops;
    expect(hasPerm(ops, PERM.ORGS_WRITE)).toBe(true);
    expect(hasPerm(ops, PERM.BILLING_WRITE)).toBe(true);
    expect(hasPerm(ops, PERM.PLANS_WRITE)).toBe(false);
    expect(hasPerm(ops, PERM.STAFF_MANAGE)).toBe(false);
    expect(canAccessPath([...ops], "/billing/invoices")).toBe(true);
    expect(canAccessPath([...ops], "/plans")).toBe(false);
  });

  it("resolvePlatformPerms falls back to owner for superuser", () => {
    const perms = resolvePlatformPerms({ is_superuser: true, platform_permissions: [] });
    expect(hasPerm(perms, PERM.BILLING_WRITE)).toBe(true);
    expect(hasPerm(perms, PERM.STAFF_MANAGE)).toBe(true);
  });

  it("resolvePlatformPerms uses role when permissions array empty", () => {
    const perms = resolvePlatformPerms({ platform_role: "ops", platform_permissions: null });
    expect(hasPerm(perms, PERM.BILLING_WRITE)).toBe(true);
    expect(hasPerm(perms, PERM.PLANS_WRITE)).toBe(false);
  });

  it("role matrix smoke: owner has full console", () => {
    const owner = ROLE_PERMS.owner;
    expect(hasPerm(owner, PERM.STAFF_MANAGE)).toBe(true);
    expect(hasPerm(owner, PERM.PLANS_WRITE)).toBe(true);
    expect(canAccessPath([...owner], "/platform/team")).toBe(true);
    expect(canAccessPath([...owner], "/security/audit-logs")).toBe(true);
  });
});
