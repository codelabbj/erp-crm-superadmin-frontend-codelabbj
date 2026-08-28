import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { hasPerm, PERM, resolvePlatformPerms } from "@/lib/platformPermissions";

export function usePlatformPerms() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
    staleTime: 60_000,
  });

  const perms = resolvePlatformPerms(me?.user);

  return {
    isLoading,
    perms,
    role: me?.user?.platform_role ?? (me?.user?.is_superuser ? "owner" : null),
    can: (perm: string) => hasPerm(perms, perm),
    canWriteOrgs: hasPerm(perms, PERM.ORGS_WRITE),
    canWriteBilling: hasPerm(perms, PERM.BILLING_WRITE),
    canWritePlans: hasPerm(perms, PERM.PLANS_WRITE),
    canManageStaff: hasPerm(perms, PERM.STAFF_MANAGE),
    canReadAudit: hasPerm(perms, PERM.AUDIT_READ),
  };
}
