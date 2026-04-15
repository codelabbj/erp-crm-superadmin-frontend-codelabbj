import { useQuery } from "@tanstack/react-query";
import { Banknote, Building2, Puzzle, Users } from "lucide-react";
import { adminApi } from "../../lib/adminApi";

export function Dashboard() {
  const { data: overview, isLoading: isOverviewLoading } = useQuery({ queryKey: ["overview"], queryFn: adminApi.overview });
  const { data: organizationsData } = useQuery({
    queryKey: ["dashboard-orgs"],
    queryFn: () => adminApi.organizations({ limit: 200, offset: 0, sort: "-created_at" }),
  });
  const { data: usersData } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => adminApi.users({ limit: 200, offset: 0, sort: "-created_at" }),
  });
  const { data: modulesData } = useQuery({
    queryKey: ["dashboard-modules"],
    queryFn: () => adminApi.modules({ sort: "sort_order" }),
  });
  const { data: subscriptionsData } = useQuery({
    queryKey: ["dashboard-subs"],
    queryFn: () => adminApi.subscriptions({ limit: 300, offset: 0, sort: "-created_at" }),
  });

  const organizations = overview?.organizations ?? organizationsData?.count ?? 0;
  const users = overview?.users ?? usersData?.count ?? 0;
  const activeModules = overview?.active_modules ?? modulesData?.filter((m) => m.is_active).length ?? 0;

  const modulesById = new Map((modulesData ?? []).map((m) => [m.id, m]));
  const estimatedMonthlyRevenue = (subscriptionsData?.results ?? []).reduce((sum, sub) => {
    if (!["active", "trial", "past_due"].includes(sub.status)) return sum;
    const module = modulesById.get(sub.module.id);
    const monthly = Number(module?.price_monthly ?? 0);
    return Number.isFinite(monthly) ? sum + monthly : sum;
  }, 0);

  const subsResults = subscriptionsData?.results ?? [];
  const kpis = [
    { label: "Organisations", value: organizations, icon: Building2 },
    { label: "Utilisateurs", value: users, icon: Users },
    { label: "Revenus estimes", value: `€${estimatedMonthlyRevenue.toLocaleString("fr-FR")}`, icon: Banknote },
    { label: "Modules actifs", value: activeModules, icon: Puzzle },
  ];

  const recentRows = (organizationsData?.results ?? [])
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 6)
    .map((o) => {
      const sub = subsResults.find((s) => s.org.id === o.id);
      return {
        id: o.id,
        name: o.name,
        domain: `${o.slug}.erp`,
        date: new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        plan: sub?.module.name || "Starter",
        status: o.is_active ? "Actif" : "En attente",
      };
    });

  const formatValue = (value: number | string) =>
    typeof value === "number" ? value.toLocaleString("fr-FR") : value;

  if (isOverviewLoading && !overview) {
    return <div className="rounded-2xl border border-border-soft bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Chargement du dashboard...</div>;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="m-0 text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vue d&apos;ensemble en temps reel.</p>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-2 inline-flex rounded-lg bg-brand-purple-100 p-2 text-brand-purple-700 dark:bg-brand-purple-700/20">
                  <Icon size={16} />
                </div>
                <p className="m-0 text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="m-0 mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatValue(kpi.value)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h3 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Activations recentes</h3>
            <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400">Dernieres organisations.</p>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Organisation</th>
                <th>Date d&apos;activation</th>
                <th>Plan</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-purple-100 font-semibold text-brand-purple-700">
                        {row.name.charAt(0)}
                      </span>
                      <div>
                        <p className="m-0 text-lg font-semibold text-slate-800 dark:text-slate-200">{row.name}</p>
                        <p className="m-0 text-sm text-slate-500 dark:text-slate-400">{row.domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-base text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td>
                    <span className="rounded-full bg-brand-purple-100 px-3 py-1 text-sm font-semibold text-brand-purple-700">
                      {row.plan}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-2 text-base ${row.status === "Actif" ? "text-emerald-600" : "text-amber-500"}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${row.status === "Actif" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="text-2xl text-slate-400">⋮</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 text-center">
          <button className="text-base font-semibold text-brand-purple-700 hover:text-brand-magenta-600">Voir toutes les organisations</button>
        </div>
      </section>
    </div>
  );
}
