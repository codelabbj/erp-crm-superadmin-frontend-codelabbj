import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

export function SubscriptionsStats() {
  const statsQuery = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => adminApi.subscriptionStats(),
  });

  const expiringSoonQuery = useQuery({
    queryKey: ["subscription-expiring-soon"],
    queryFn: () => adminApi.subscriptionExpiringSoon(),
  });

  const stats = statsQuery.data as any;
  const planDistribution = Object.entries((stats?.plan_distribution as Record<string, number>) ?? {});
  
  const rawExpiringData = expiringSoonQuery.data as any;
  const expiringData = Array.isArray(rawExpiringData) ? rawExpiringData : (rawExpiringData?.results ?? []);

  return (
    <section className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Statistiques abonnements</h3>

      {statsQuery.isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {statsQuery.isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(statsQuery.error)}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Organisations actives</p>
          <p className="m-0 mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{stats?.total_active_organizations ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Modules actifs (total)</p>
          <p className="m-0 mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{stats?.total_active_modules ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Abonnements en trial</p>
          <p className="m-0 mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{stats?.total_trial_subscriptions ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Expirent dans 7 jours</p>
          <p className="m-0 mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{stats?.expiring_in_7_days ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700 md:col-span-2">
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Revenu mensuel estime</p>
          <p className="m-0 mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{stats?.estimated_monthly_revenue ?? 0}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Repartition par plan</p>
          {planDistribution.length === 0 ? (
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Aucune donnee.</p>
          ) : (
            <ul className="m-0 grid gap-1 p-0">
              {planDistribution.map(([plan, count]) => (
                <li key={plan} className="list-none text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">{plan}</span>: {count}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Expirations proches</p>
          {expiringSoonQuery.isLoading ? <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Chargement...</p> : null}
          {expiringSoonQuery.isError ? <p className="m-0 text-xs text-red-700">{getErrorMessage(expiringSoonQuery.error)}</p> : null}
          {expiringData.length === 0 ? (
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Aucune alerte d'expiration proche.</p>
          ) : (
            <ul className="m-0 grid gap-1 p-0">
              {expiringData.slice(0, 8).map((item: any, idx: number) => (
                <li key={`${item.organization_id ?? idx}-${item.module_code ?? "module"}`} className="list-none text-sm text-slate-700 dark:text-slate-300">
                  {(item.organization_name ?? "Organisation")} {item.module_code ? `- ${item.module_code}` : ""} {item.ends_at ? `(${item.ends_at})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
