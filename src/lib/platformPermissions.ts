/** Permissions console Super Admin (alignées backend). */
export const PERM = {
  CONSOLE_ACCESS: "console.access",
  ORGS_READ: "orgs.read",
  ORGS_WRITE: "orgs.write",
  BILLING_WRITE: "billing.write",
  PLANS_WRITE: "plans.write",
  STAFF_MANAGE: "staff.manage",
  AUDIT_READ: "audit.read",
  SETTINGS_SELF: "settings.self",
} as const;

export function hasPerm(perms: readonly string[] | undefined | null, perm: string): boolean {
  if (!perms?.length) return false;
  return perms.includes(perm);
}

/** Mapping path → permission requise (absence = accessible si console.access). */
export const PATH_PERMISSION: Record<string, string> = {
  "/platform/team": PERM.STAFF_MANAGE,
  "/plans": PERM.PLANS_WRITE,
  "/billing/invoices": PERM.BILLING_WRITE,
  "/billing/business-invoices": PERM.BILLING_WRITE,
  "/billing/dedicated-instances": PERM.BILLING_WRITE,
  "/security/audit-logs": PERM.AUDIT_READ,
};

/** Matrice rôles phase 1 (smoke / docs). */
export const ROLE_PERMS: Record<string, readonly string[]> = {
  owner: [
    PERM.CONSOLE_ACCESS,
    PERM.ORGS_READ,
    PERM.ORGS_WRITE,
    PERM.BILLING_WRITE,
    PERM.PLANS_WRITE,
    PERM.STAFF_MANAGE,
    PERM.AUDIT_READ,
    PERM.SETTINGS_SELF,
  ],
  ops: [
    PERM.CONSOLE_ACCESS,
    PERM.ORGS_READ,
    PERM.ORGS_WRITE,
    PERM.BILLING_WRITE,
    PERM.AUDIT_READ,
    PERM.SETTINGS_SELF,
  ],
  support: [PERM.CONSOLE_ACCESS, PERM.ORGS_READ, PERM.AUDIT_READ, PERM.SETTINGS_SELF],
  viewer: [PERM.CONSOLE_ACCESS, PERM.ORGS_READ, PERM.SETTINGS_SELF],
};

export function canAccessPath(perms: readonly string[] | undefined | null, pathname: string): boolean {
  const required = PATH_PERMISSION[pathname];
  if (!required) return true;
  return hasPerm(perms, required);
}
