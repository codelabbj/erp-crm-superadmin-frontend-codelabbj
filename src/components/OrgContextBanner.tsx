import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { orgDetailPath } from "@/lib/orgNavigation";

type Props = {
  orgId: string;
  label?: string;
};

/** Bandeau retour vers la fiche organisation d'origine. */
export function OrgContextBanner({ orgId, label }: Props) {
  const navigate = useNavigate();
  const { data: org } = useQuery({
    queryKey: ["org-detail", orgId],
    queryFn: () => adminApi.organizationDetail(orgId),
    staleTime: 60_000,
  });

  const orgName = org?.name || label || "Organisation";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-purple-200 bg-brand-purple-50/60 px-4 py-3 dark:border-brand-purple-900/40 dark:bg-brand-purple-900/15">
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <Building2 size={16} className="shrink-0 text-brand-purple-600" />
        <span>
          Contexte : <strong className="text-slate-900 dark:text-slate-100">{orgName}</strong>
        </span>
      </div>
      <button
        type="button"
        className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
        onClick={() => navigate(orgDetailPath(orgId))}
      >
        <ArrowLeft size={14} />
        Retour à l&apos;organisation
      </button>
    </div>
  );
}
