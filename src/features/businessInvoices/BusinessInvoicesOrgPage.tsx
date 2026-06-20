import { Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgContextBanner } from "@/components/OrgContextBanner";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { OrgBusinessInvoicesPanel } from "@/features/organizations/components/OrgBusinessInvoicesPanel";
import { adminApi } from "@/lib/adminApi";
import { ORG_QUERY_KEY } from "@/lib/orgNavigation";

/** Facturation Business filtrée par organisation (?org=uuid). */
export function BusinessInvoicesOrgPage() {
  const [params] = useSearchParams();
  const orgId = params.get(ORG_QUERY_KEY)?.trim() || "";

  if (!orgId) {
    return <Navigate to="/organizations" replace />;
  }

  const { data: related, isLoading } = useQuery({
    queryKey: ["org-related", orgId],
    queryFn: () => adminApi.organizationRelatedData(orgId),
  });

  const orgName = related?.data?.organization?.name || "Organisation";
  const ownerEmail =
    related?.data?.users?.find((u: { is_owner?: boolean; email?: string }) => u.is_owner)?.email ??
    related?.data?.users?.[0]?.email ??
    "";

  return (
    <ListPageShell>
      <OrgContextBanner orgId={orgId} label={orgName} />
      <PageHeader
        title="Facturation Business"
        description={`Factures PAL et virements pour ${orgName}.`}
      />
      {isLoading ? (
        <p className="text-sm text-neutral-6">Chargement…</p>
      ) : (
        <OrgBusinessInvoicesPanel
          orgId={orgId}
          orgName={orgName}
          defaultRecipientEmail={ownerEmail}
        />
      )}
    </ListPageShell>
  );
}
