import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Building2, MoreVertical, Puzzle, Users, Rocket } from "lucide-react";
import { adminApi } from "../../lib/adminApi";

type DashboardProps = {
  onOpenOrgSubscriptions: (orgId: string) => void;
  onOpenOrganizationsList: () => void;
};

function RowActionsMenu({ onViewSubscriptions, onViewInList }: { onViewSubscriptions: () => void; onViewInList: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative flex justify-end" ref={wrapRef}>
      <button
        type="button"
        className="btn-secondary h-9 w-9 p-0"
        aria-label="Actions sur cette organisation"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={20} strokeWidth={2.25} />
      </button>
      {open ? (
        <ul
          className="absolute right-0 top-full z-20 mt-1 min-w-[min(240px,88vw)] rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
          role="menu"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                onViewSubscriptions();
                setOpen(false);
              }}
            >
              Voir l&apos;abonnement
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                onViewInList();
                setOpen(false);
              }}
            >
              Liste des organisations
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export function Dashboard({ onOpenOrgSubscriptions, onOpenOrganizationsList }: DashboardProps) {
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

  const organizations = overview?.organizations ?? organizationsData?.count;
  const users = overview?.users ?? usersData?.count;
  const activeModules = overview?.active_modules ?? modulesData?.filter((m) => m.is_active).length;
  const activeSubscriptions = overview?.active_subscriptions ?? subscriptionsData?.count;
  const mrr = overview?.mrr;

  const kpis = [
    { 
      label: "Organisations", 
      value: (overview?.active_orgs !== undefined && overview?.total_orgs !== undefined) 
        ? `${overview.active_orgs} / ${overview.total_orgs}` 
        : organizations, 
      icon: Building2 
    },
    { label: "Utilisateurs", value: users, icon: Users },
    { label: "Abonnements actifs", value: activeSubscriptions, icon: Rocket },
    { label: "Revenus estimes", value: mrr !== undefined && mrr !== null ? `€${mrr.toLocaleString("fr-FR")}` : undefined, icon: Banknote },
    { label: "Modules actifs", value: activeModules, icon: Puzzle },
  ].filter(kpi => kpi.value !== undefined && kpi.value !== null);

  const subsResults = subscriptionsData?.results ?? [];

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

  const formatValue = (value: number | string | undefined) =>
    typeof value === "number" ? value.toLocaleString("fr-FR") : (value ?? "");

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
                  <td className="w-[52px]">
                    <RowActionsMenu
                      onViewSubscriptions={() => onOpenOrgSubscriptions(row.id)}
                      onViewInList={onOpenOrganizationsList}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 text-center">
          <button
            type="button"
            className="btn-ghost"
            onClick={onOpenOrganizationsList}
          >
            Voir toutes les organisations
          </button>
        </div>
      </section>
    </div>
  );
}
