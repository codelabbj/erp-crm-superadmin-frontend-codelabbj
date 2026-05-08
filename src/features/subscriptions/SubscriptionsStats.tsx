import { useQuery } from "@tanstack/react-query";
import { adminApi, type SubscriptionStats, type SubscriptionAlerts } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";
import { AlertCircle, Clock, ShieldAlert, Users } from "lucide-react";

export function SubscriptionsStats() {
  const statsQuery = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => adminApi.subscriptionStats(),
  });

  const alertsQuery = useQuery({
    queryKey: ["subscription-alerts"],
    queryFn: () => adminApi.subscriptionAlerts(),
  });

  const stats = statsQuery.data as SubscriptionStats;
  const alerts = alertsQuery.data as SubscriptionAlerts;

  return (
    <section className="grid gap-5">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatSummaryCard
          title="Abonnements Actifs"
          value={stats?.summary.total_active ?? 0}
          icon={<ShieldAlert className="text-emerald-500" size={20} />}
        />
        <StatSummaryCard
          title="Expirés"
          value={stats?.summary.total_expired ?? 0}
          icon={<AlertCircle className="text-rose-500" size={20} />}
        />
        <StatSummaryCard
          title="Annulés"
          value={stats?.summary.total_cancelled ?? 0}
          icon={<Clock className="text-slate-400" size={20} />}
        />
        <StatSummaryCard
          title="Total Organisations"
          value={stats?.summary.total_organizations ?? 0}
          icon={<Users className="text-brand-purple-500" size={20} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Distribution Charts */}
        <div className="space-y-4 rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Distribution</h3>
          
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold text-slate-400 uppercase">Par Plan</p>
              <div className="flex flex-wrap gap-2">
                {stats?.by_plan.map(p => (
                  <div key={p.plan_code} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{p.plan_code}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold text-slate-400 uppercase">Par Module (Top 6)</p>
              <div className="grid grid-cols-2 gap-3">
                {stats?.by_module.slice(0, 6).map(m => (
                  <div key={m.module_code} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate pr-2">{m.module_name}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-border-soft p-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Alertes & Expirations</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-5 space-y-4">
            {alerts?.expired.items.length ? (
              <div>
                <p className="mb-2 text-[10px] font-bold text-rose-500 uppercase">Expirés ({alerts.expired.count})</p>
                <div className="space-y-2">
                  {alerts.expired.items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-rose-50 p-3 dark:bg-rose-900/10">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.org.name}</p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400">{item.module.name} • Expiré il y a {item.days_expired}j</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatIsoDate(item.ends_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {alerts?.no_plan.items.length ? (
              <div>
                <p className="mb-2 text-[10px] font-bold text-amber-500 uppercase">Sans Plan ({alerts.no_plan.count})</p>
                <div className="space-y-2">
                  {alerts.no_plan.items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3 dark:bg-amber-900/10">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">Inscrit depuis {item.days_since_creation}j</p>
                      </div>
                      <button className="text-[10px] font-bold text-brand-purple-600 uppercase hover:underline">Assigner</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!alerts?.expired.count && !alerts?.no_plan.count && !alertsQuery.isLoading && (
              <p className="py-8 text-center text-xs text-slate-400">Aucune alerte critique pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatSummaryCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">{icon}</div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
