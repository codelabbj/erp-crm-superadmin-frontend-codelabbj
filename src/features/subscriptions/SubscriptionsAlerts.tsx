import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

export function SubscriptionsAlerts() {
  const alertsQuery = useQuery({
    queryKey: ["subscription-alerts"],
    queryFn: () => adminApi.subscriptionAlerts(),
  });

  const alerts = alertsQuery.data;

  const sections = [
    {
      title: "Abonnements expires",
      items: alerts?.expired ?? [],
      empty: "Aucun abonnement expire.",
    },
    {
      title: "Essais se terminant bientot",
      items: alerts?.trial_ending_soon ?? [],
      empty: "Aucun essai en fin proche.",
    },
    {
      title: "Organisations sans plan",
      items: alerts?.no_plan ?? [],
      empty: "Aucune organisation sans plan.",
    },
  ];

  return (
    <section className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Alertes abonnements</h3>

      {alertsQuery.isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {alertsQuery.isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(alertsQuery.error)}</p> : null}

      <div className="grid gap-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{section.title}</p>
            {section.items.length === 0 ? (
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">{section.empty}</p>
            ) : (
              <ul className="m-0 grid gap-1 p-0">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}-${item.organization_id ?? idx}`} className="list-none text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{item.organization_name ?? "Organisation"}</span>
                    {item.plan_code ? ` - plan: ${item.plan_code}` : ""}
                    {item.module_code ? ` - module: ${item.module_code}` : ""}
                    {item.ends_at ? ` - fin: ${formatIsoDate(item.ends_at)}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
