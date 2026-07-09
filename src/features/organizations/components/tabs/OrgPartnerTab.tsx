import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { formatIsoDate } from "@/lib/ui";

type Props = {
  orgId: string;
};

export function OrgPartnerTab({ orgId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["org-detail", orgId],
    queryFn: () => adminApi.organizationDetail(orgId),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Chargement…</p>;

  const partner = data?.referred_by_partner;

  if (!partner) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Handshake size={18} />
          <p className="text-sm">Cette organisation n'a pas été référée par un partenaire.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold">Partenaire référent</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Partenaire</dt>
          <dd className="font-semibold">{partner.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Code</dt>
          <dd className="font-mono">{partner.code}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Taux commission</dt>
          <dd>{partner.commission_rate}%</dd>
        </div>
        <div>
          <dt className="text-slate-500">Code utilisé à l'inscription</dt>
          <dd>{data?.referral_code_used || partner.code}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Date de référencement</dt>
          <dd>{data?.referred_at ? formatIsoDate(data.referred_at) : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
