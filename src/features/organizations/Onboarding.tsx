import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, CheckCircle2, Clock, AlertCircle, PlayCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";

export function Onboarding() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-jobs", q],
    queryFn: () => adminApi.onboardingJobs({ q }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => adminApi.retryOnboardingJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-jobs"] }),
  });

  const jobs = data?.results || [];

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Onboarding Pipeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi du déploiement et de la configuration initiale des tenants.</p>
        </div>
        <div className="rounded-full bg-brand-purple-50 px-4 py-1.5 text-xs font-bold text-brand-purple-600 dark:bg-brand-purple-900/20 dark:text-brand-purple-400">
          {data?.count || 0} Jobs au total
        </div>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher une organisation, un stage ou un statut..."
          className="flex-1 bg-transparent text-sm outline-none dark:text-slate-200"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Organisation</th>
              <th className="px-6 py-4">Étape Actuelle</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Lancé le</th>
              <th className="px-6 py-4">Terminé le</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Chargement du pipeline...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Aucun job d&apos;onboarding trouvé.</td></tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{job.tenant_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{job.tenant_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {job.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} error={job.error} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {formatIsoDate(job.started_at)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {job.completed_at ? formatIsoDate(job.completed_at) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {job.status === "failed" && (
                      <button
                        onClick={() => retryMutation.mutate(job.id)}
                        disabled={retryMutation.isPending}
                        className="btn-ghost h-9 w-9 p-0 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-900/20"
                        title="Relancer le job"
                      >
                        {retryMutation.isPending && retryMutation.variables === job.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <RefreshCw size={18} />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status, error }: { status: string; error: string | null }) {
  let style = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  let icon = <Clock size={12} />;

  if (status === "completed") {
    style = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    icon = <CheckCircle2 size={12} />;
  } else if (status === "failed") {
    style = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    icon = <AlertCircle size={12} />;
  } else if (status === "pending" || status === "running") {
    style = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    icon = <PlayCircle size={12} className="animate-pulse" />;
  }

  return (
    <div className="grid gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style}`}>
        {icon} {status}
      </span>
      {error && <p className="max-w-[150px] truncate text-[9px] text-rose-500" title={error}>{error}</p>}
    </div>
  );
}
