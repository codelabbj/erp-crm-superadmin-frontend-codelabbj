import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  Globe2,
  MoreVertical,
  Puzzle,
  Rocket,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { adminApi, type SupportTicket } from "../../lib/adminApi";
import { formatIsoDate, normalizeList } from "../../lib/ui";
import { paginatedCount } from "@/lib/pagination";
import {
  aggregateByField,
  countryFlag,
  formatPercent,
  seriesNewOrgsByMonth,
} from "./dashboardUtils";
import { formatMoney } from "@/lib/money";
import {
  AlertPill,
  DashboardSection,
  DistributionBars,
  HealthDot,
  KpiCard,
  MiniBarChart,
} from "./components/DashboardWidgets";

type DashboardProps = {
  onOpenOrgSubscriptions: (orgId: string) => void;
  onOpenOrganizationsList: () => void;
};

function RowActionsMenu({
  onViewSubscriptions,
  onViewInList,
}: {
  onViewSubscriptions: () => void;
  onViewInList: () => void;
}) {
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
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: adminApi.overview,
  });
  const { data: businessMetrics } = useQuery({
    queryKey: ["dashboard-business-metrics"],
    queryFn: () => adminApi.businessMetrics(),
  });
  const { data: subStats } = useQuery({
    queryKey: ["dashboard-sub-stats"],
    queryFn: adminApi.subscriptionStats,
  });
  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: adminApi.subscriptionAlerts,
  });
  const { data: health } = useQuery({
    queryKey: ["dashboard-health"],
    queryFn: adminApi.platformHealthSummary,
  });
  const { data: services } = useQuery({
    queryKey: ["dashboard-health-services"],
    queryFn: adminApi.platformHealthServices,
  });
  const { data: orgsOverview } = useQuery({
    queryKey: ["dashboard-orgs-overview"],
    queryFn: () => adminApi.organizationsOverview({ limit: 12, offset: 0, sort: "-created_at" }),
  });
  const { data: orgsGeo } = useQuery({
    queryKey: ["dashboard-orgs-geo"],
    queryFn: () => adminApi.organizations({ limit: 200, offset: 0, sort: "-created_at" }),
  });
  const { data: onboardingData } = useQuery({
    queryKey: ["dashboard-onboarding"],
    queryFn: () => adminApi.onboardingJobs({ limit: 50, offset: 0, ordering: "-started_at" }),
  });
  const { data: ticketsData } = useQuery({
    queryKey: ["dashboard-support-tickets"],
    queryFn: adminApi.supportTickets,
  });
  const { data: invoicesData } = useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: () => adminApi.billingInvoices({ limit: 100, offset: 0, sort: "-issued_at" }),
  });

  const tickets = useMemo(() => normalizeList<SupportTicket>(ticketsData), [ticketsData]);
  const openTickets = tickets.filter((t) => ["open", "pending", "in_progress"].includes(String(t.status))).length;

  const onboardingPending = useMemo(
    () => (onboardingData?.results ?? []).filter((j) => j.status === "pending" || j.status === "failed").length,
    [onboardingData],
  );

  const unpaidInvoices = useMemo(() => {
    const list = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.results ?? []);
    return list.filter((inv) => {
      const st = String(inv.status ?? "").toLowerCase();
      const pay = String(inv.payment_state ?? "").toLowerCase();
      return st === "draft" || st === "sent" || pay === "unpaid" || pay === "pending";
    }).length;
  }, [invoicesData]);

  const countries = useMemo(
    () => aggregateByField(orgsGeo?.results ?? [], "country").slice(0, 5),
    [orgsGeo],
  );
  const currencies = useMemo(
    () => aggregateByField(orgsGeo?.results ?? [], "currency").slice(0, 4),
    [orgsGeo],
  );

  const seatUtilization = useMemo(() => {
    const orgs = orgsOverview?.results ?? [];
    const withSeats = orgs.filter((o) => (o.seats_included ?? 0) > 0);
    if (!withSeats.length) return null;
    const ratio =
      withSeats.reduce((acc, o) => acc + (o.seats_used ?? 0) / (o.seats_included ?? 1), 0) / withSeats.length;
    return Math.round(ratio * 100);
  }, [orgsOverview]);

  const mrr = businessMetrics?.mrr ?? overview?.mrr;
  const arr = businessMetrics?.arr ?? overview?.arr ?? (mrr != null ? mrr * 12 : undefined);
  const activeTenants = businessMetrics?.active_tenants ?? overview?.active_orgs ?? overview?.organizations;
  const arpu = mrr != null && activeTenants ? mrr / activeTenants : undefined;

  const tenantSeries = useMemo(() => {
    const fromMetrics = businessMetrics?.time_series?.new_tenants_by_month;
    if (fromMetrics?.length) return fromMetrics;
    return seriesNewOrgsByMonth(orgsGeo?.results ?? []);
  }, [businessMetrics, orgsGeo?.results]);

  const planDistribution = useMemo(() => {
    const fromStats = subStats?.by_plan?.map((p) => ({ label: p.plan_code, count: p.count })) ?? [];
    const fromBiz = businessMetrics?.by_plan?.map((p) => ({ label: p.plan_code, count: p.count })) ?? [];
    return fromStats.length ? fromStats : fromBiz;
  }, [subStats, businessMetrics]);

  const moduleDistribution =
    subStats?.by_module?.map((m) => ({ label: m.module_name || m.module_code, count: m.count })) ?? [];

  const servicesOk = services?.services.filter((s) => s.status === "ok").length ?? 0;
  const servicesTotal = services?.services.length ?? 0;

  const criticalAlerts =
    (alerts?.expired.count ?? 0) + (alerts?.no_plan.count ?? 0) + (alerts?.trial_ending_soon.count ?? 0);

  const recentRows = useMemo(
    () =>
      (orgsOverview?.results ?? []).slice(0, 6).map((o) => ({
        id: o.id,
        name: o.name,
        domain: `${o.slug}.erp`,
        date: formatIsoDate(o.created_at),
        plan: o.plan_code || "—",
        status: o.status === "trial" ? "Essai" : o.is_active !== false ? "Actif" : "Suspendu",
        statusTone: o.status === "trial" ? "amber" : o.is_active !== false ? "emerald" : "slate",
      })),
    [orgsOverview],
  );

  if (isOverviewLoading && !overview && !businessMetrics) {
    return (
      <div className="rounded-2xl border border-border-soft bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Chargement du tableau de bord…
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* En-tête exécutif */}
      <header className="rounded-2xl border border-border-soft bg-gradient-to-br from-brand-purple-950 via-brand-purple-900 to-slate-900 p-6 text-white shadow-lg dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[11px] font-bold tracking-[0.2em] text-brand-purple-200 uppercase">
              CodeLab ERP · Super Admin
            </p>
            <h1 className="m-0 mt-1 text-2xl font-bold tracking-tight">Centre de commandement plateforme</h1>
            <p className="m-0 mt-2 max-w-2xl text-sm text-brand-purple-100/90">
              Vue consolidée revenus, tenants, rétention et santé infrastructure — périmètre multi-pays.
            </p>
          </div>
          <div className="grid gap-1 text-right text-xs text-brand-purple-200">
            <span className="inline-flex items-center justify-end gap-1.5">
              <Activity size={14} />
              Sync {formatIsoDate(health?.updated_at ?? alerts?.generated_at) || "—"}
            </span>
            <span>
              {paginatedCount(orgsGeo)} tenants · {overview?.users?.toLocaleString("fr-FR") ?? "—"} utilisateurs
            </span>
          </div>
        </div>
        {criticalAlerts > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            <AlertTriangle size={16} />
            <span>
              <strong>{criticalAlerts}</strong> alerte{criticalAlerts > 1 ? "s" : ""} abonnement nécessitent une
              attention.
            </span>
            <Link to="/subscriptions?tab=alerts" className="ml-auto font-semibold underline underline-offset-2">
              Voir les alertes
            </Link>
          </div>
        ) : null}
      </header>

      {/* Revenus & croissance */}
      <DashboardSection title="Revenus & croissance" description="Indicateurs SaaS (Franc CFA — XOF)">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <KpiCard
            label="MRR"
            value={formatMoney(mrr)}
            hint="Revenu récurrent mensuel"
            icon={<Banknote size={18} />}
            accent="emerald"
          />
          <KpiCard
            label="ARR"
            value={formatMoney(arr)}
            hint="Revenu récurrent annuel"
            icon={<TrendingUp size={18} />}
            accent="emerald"
          />
          <KpiCard
            label="ARPU"
            value={formatMoney(arpu)}
            hint="Revenu moyen par tenant actif"
            icon={<Wallet size={18} />}
            accent="blue"
          />
          <KpiCard
            label="Tenants actifs"
            value={
              overview?.active_orgs != null && overview?.total_orgs != null
                ? `${overview.active_orgs} / ${overview.total_orgs}`
                : (activeTenants?.toLocaleString("fr-FR") ?? "—")
            }
            icon={<Building2 size={18} />}
            accent="purple"
          />
          <KpiCard
            label="Utilisateurs"
            value={overview?.users?.toLocaleString("fr-FR") ?? "—"}
            hint={
              health
                ? `${health.active_users} actifs sur ${health.total_users}`
                : undefined
            }
            icon={<Users size={18} />}
            accent="purple"
          />
          <KpiCard
            label="Abonnements actifs"
            value={subStats?.summary.total_active ?? overview?.active_subscriptions ?? "—"}
            icon={<Rocket size={18} />}
            accent="blue"
          />
        </div>
      </DashboardSection>

      {/* Rétention & conversion + Infrastructure */}
      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSection title="Rétention & conversion" description="Santé commerciale du portefeuille">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Churn"
              value={formatPercent(businessMetrics?.churn_rate)}
              trend={businessMetrics?.churn_rate != null && businessMetrics.churn_rate <= 3 ? "up" : "down"}
              trendLabel={businessMetrics?.churn_rate != null && businessMetrics.churn_rate <= 3 ? "Sain" : "Surveiller"}
              icon={<TrendingUp size={16} />}
              accent="rose"
            />
            <KpiCard
              label="NRR"
              value={formatPercent(businessMetrics?.net_revenue_retention)}
              icon={<Zap size={16} />}
              accent="emerald"
            />
            <KpiCard
              label="Trial → Paid"
              value={formatPercent(businessMetrics?.trial_to_paid_rate)}
              icon={<Rocket size={16} />}
              accent="amber"
            />
            <KpiCard
              label="Sièges utilisés"
              value={seatUtilization != null ? `${seatUtilization} %` : "—"}
              hint="Moyenne tenants récents"
              icon={<Users size={16} />}
              accent="slate"
            />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Infrastructure"
          description="Disponibilité & performance API"
          action={
            <Link to="/platform-health" className="text-xs font-semibold text-brand-purple-600 dark:text-brand-magenta-400">
              Détail santé →
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Uptime"
              value={health ? `${health.global_uptime_percent} %` : "—"}
              icon={<Globe2 size={16} />}
              accent="emerald"
            />
            <KpiCard
              label="Latence API"
              value={health ? `${health.avg_api_latency_ms} ms` : "—"}
              icon={<Activity size={16} />}
              accent="blue"
            />
            <KpiCard
              label="Taux d'erreur"
              value={health ? `${health.error_rate_percent} %` : "—"}
              icon={<ShieldCheck size={16} />}
              accent="rose"
            />
            <KpiCard
              label="Services OK"
              value={servicesTotal ? `${servicesOk}/${servicesTotal}` : "—"}
              icon={<Server size={16} />}
              accent="slate"
            />
          </div>
          {services?.services.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {services.services.slice(0, 8).map((svc) => (
                <span
                  key={svc.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <HealthDot status={svc.status} />
                  {svc.name}
                </span>
              ))}
            </div>
          ) : null}
        </DashboardSection>
      </div>

      {/* Graphiques & répartitions */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardSection
          title="Nouvelles organisations"
          description="Inscriptions clientes par mois — chaque barre compte les orgs créées sur la plateforme"
          className="lg:col-span-1"
          action={
            <Link to="/business-metrics" className="text-xs font-semibold text-brand-purple-600 dark:text-brand-magenta-400">
              Métriques →
            </Link>
          }
        >
          <MiniBarChart
            data={tenantSeries}
            colorClass="bg-brand-purple-500"
            emptyLabel="Aucune organisation enregistrée sur la période."
            unitLabel="nouvelle(s) org."
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Une <strong>organisation</strong> = un client ERP (entreprise avec son espace, utilisateurs et abonnement).
            Ce n&apos;est pas le nombre total d&apos;orgs actives, seulement les <strong>nouvelles inscriptions</strong> du mois.
          </p>
        </DashboardSection>

        <DashboardSection title="Répartition par plan" className="lg:col-span-1">
          <DistributionBars items={planDistribution} />
        </DashboardSection>

        <DashboardSection title="Modules les plus souscrits" className="lg:col-span-1">
          <DistributionBars items={moduleDistribution} />
          <p className="mt-3 text-[11px] text-slate-500">
            {overview?.active_modules ?? "—"} modules actifs au catalogue
            <Puzzle size={12} className="ml-1 inline" />
          </p>
        </DashboardSection>
      </div>

      {/* Opérations & présence internationale */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardSection title="Opérations" description="Files d'attente & support">
          <div className="grid gap-2 sm:grid-cols-2">
            <AlertPill label="Abonnements expirés" count={alerts?.expired.count ?? 0} tone="rose" to="/subscriptions?tab=alerts" />
            <AlertPill label="Sans plan assigné" count={alerts?.no_plan.count ?? 0} tone="amber" to="/subscriptions?tab=alerts" />
            <AlertPill label="Essais bientôt terminés" count={alerts?.trial_ending_soon.count ?? 0} tone="blue" to="/subscriptions?tab=alerts" />
            <AlertPill label="Tickets support ouverts" count={openTickets} tone="blue" to="/business/support" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <KpiCard
              label="Onboarding en cours"
              value={onboardingPending}
              hint="Jobs pending / failed"
              icon={<Rocket size={16} />}
              accent="amber"
            />
            <KpiCard
              label="Factures à encaisser"
              value={unpaidInvoices}
              icon={<Banknote size={16} />}
              accent="rose"
            />
          </div>
        </DashboardSection>

        <DashboardSection title="Présence internationale" description="Répartition géographique des tenants">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Top pays</p>
              <ul className="space-y-2">
                {countries.length ? (
                  countries.map((c) => (
                    <li key={c.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span aria-hidden>{countryFlag(c.key)}</span>
                        {c.label}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{c.count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">Données pays indisponibles</li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Devises</p>
              <ul className="space-y-2">
                {currencies.length ? (
                  currencies.map((c) => (
                    <li key={c.key} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-slate-700 dark:text-slate-300">{c.label}</span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{c.count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">—</li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/subscriptions?tab=stats" className="btn-secondary px-3 py-1.5 text-xs">
              Stats abonnements
            </Link>
            <Link to="/onboarding" className="btn-secondary px-3 py-1.5 text-xs">
              Onboarding
            </Link>
            <Link to="/organizations" className="btn-secondary px-3 py-1.5 text-xs">
              Organisations
            </Link>
          </div>
        </DashboardSection>
      </div>

      {/* Activations récentes */}
      <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h3 className="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">Activations récentes</h3>
            <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400">Derniers tenants provisionnés</p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={onOpenOrganizationsList}>
            Toutes les organisations
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-6 py-3 text-left">Organisation</th>
                <th className="px-6 py-3 text-left">Activation</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.length ? (
                recentRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-purple-100 font-semibold text-brand-purple-700 dark:bg-brand-purple-900/40 dark:text-brand-purple-300">
                          {row.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 truncate font-semibold text-slate-800 dark:text-slate-200">{row.name}</p>
                          <p className="m-0 truncate text-xs text-slate-500">{row.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-brand-purple-100 px-2.5 py-0.5 text-xs font-semibold text-brand-purple-700 dark:bg-brand-purple-900/30 dark:text-brand-purple-300">
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          row.statusTone === "emerald"
                            ? "text-emerald-600"
                            : row.statusTone === "amber"
                              ? "text-amber-600"
                              : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            row.statusTone === "emerald"
                              ? "bg-emerald-500"
                              : row.statusTone === "amber"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="w-[52px] px-6 py-4">
                      <RowActionsMenu
                        onViewSubscriptions={() => onOpenOrgSubscriptions(row.id)}
                        onViewInList={onOpenOrganizationsList}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Aucune organisation récente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
