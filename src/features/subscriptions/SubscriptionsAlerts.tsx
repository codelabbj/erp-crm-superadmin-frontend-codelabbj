import { useQuery } from "@tanstack/react-query";
import { adminApi, type SubscriptionAlerts } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";
import { AlertCircle, Clock, ShieldAlert, ArrowRight, Building2 } from "lucide-react";

export function SubscriptionsAlerts() {
  const alertsQuery = useQuery({
    queryKey: ["subscription-alerts"],
    queryFn: () => adminApi.subscriptionAlerts(),
  });

  const alerts = alertsQuery.data as SubscriptionAlerts;

  return (
    <div className="grid gap-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Alertes & Surveillances</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Suivi critique des expirations et des organisations sans abonnement actif.</p>
      </header>

      {alertsQuery.isLoading ? (
        <div className="py-20 text-center text-slate-400">Chargement des alertes...</div>
      ) : alertsQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700 dark:border-red-900/20 dark:bg-red-900/10">
          {getErrorMessage(alertsQuery.error)}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section: Expired */}
          <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-border-soft p-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-900/20">
                  <AlertCircle size={18} className="text-rose-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Abonnements expirés</h3>
              </div>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                {alerts.expired.count}
              </span>
            </div>
            <div className="divide-y divide-border-soft dark:divide-slate-800">
              {alerts.expired.items.length === 0 ? (
                <p className="p-10 text-center text-xs text-slate-400">Aucun abonnement expiré trouvé.</p>
              ) : (
                alerts.expired.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.org.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.module.name} • <span className="font-medium text-rose-500">Expiré il y a {item.days_expired}j</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Échéance</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatIsoDate(item.ends_at)}</p>
                      </div>
                      <button className="btn-ghost h-9 w-9 p-0">
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: No Plan */}
          <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-border-soft p-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20">
                  <ShieldAlert size={18} className="text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Organisations sans plan</h3>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {alerts.no_plan.count}
              </span>
            </div>
            <div className="divide-y divide-border-soft dark:divide-slate-800">
              {alerts.no_plan.items.length === 0 ? (
                <p className="p-10 text-center text-xs text-slate-400">Toutes les organisations ont un plan.</p>
              ) : (
                alerts.no_plan.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                        <Building2 size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Inscrit depuis {item.days_since_creation} jours
                        </p>
                      </div>
                    </div>
                    <button className="btn-magenta px-3 py-1.5 text-xs">
                      Assigner
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Trials (Placeholders or Real if count > 0) */}
          <div className="lg:col-span-2 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
              <Clock size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {alerts.trial_ending_soon.count} essai(s) se terminant bientôt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
