import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Users,
  History,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Zap,
  Globe,
  Settings2,
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
  CalendarDays,
  Info,
} from "lucide-react";
import { adminApi, type AssignPlanPayload, type OrganizationDetail as OrgMeta } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";
import { formatMoneyFromApi } from "@/lib/money";
import { KpiCard, DistributionBars } from "@/features/dashboard/components/DashboardWidgets";
import { OrgAssignPlanModal } from "@/features/organizations/components/OrgAssignPlanModal";
import { OrgBusinessInvoicesPanel } from "@/features/organizations/components/OrgBusinessInvoicesPanel";
import { OrgBusinessPlanRequestsPanel } from "@/features/organizations/components/OrgBusinessPlanRequestsPanel";
import { OrgDedicatedInstancePanel } from "@/features/organizations/components/OrgDedicatedInstancePanel";
import { OrgDetailTabBar } from "@/features/organizations/components/OrgDetailTabBar";
import { OrgTeamTab } from "@/features/organizations/components/tabs/OrgTeamTab";
import { type OrgDetailTab, readOrgDetailTab } from "@/lib/orgNavigation";
import { MODULE_LABELS, planPeriodProgress, resolveMediaUrl } from "@/features/organizations/orgPlanUtils";

type OrganizationDetailProps = {
  orgId: string;
  onBack: () => void;
  onOpenAudit: () => void;
};

export function OrganizationDetail({ orgId, onBack, onOpenAudit }: OrganizationDetailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = readOrgDetailTab(`?${searchParams.toString()}`);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const setActiveTab = (tab: OrgDetailTab) => {
    if (tab === "overview") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  const { data: orgMeta, isLoading: isMetaLoading } = useQuery({
    queryKey: ["org-detail", orgId],
    queryFn: () => adminApi.organizationDetail(orgId),
  });

  const { data: relatedData, isLoading: isRelatedLoading } = useQuery({
    queryKey: ["org-related", orgId],
    queryFn: () => adminApi.organizationRelatedData(orgId),
  });

  const { data: subs, isLoading: isSubsLoading } = useQuery({
    queryKey: ["org-subs", orgId],
    queryFn: () => adminApi.organizationSubscriptions(orgId, { limit: 50, offset: 0, sort: "-starts_at" }),
  });

  const { data: plans } = useQuery({
    queryKey: ["licensing-plans"],
    queryFn: () => adminApi.licensingPlans(),
  });

  const assignPlanMutation = useMutation({
    mutationFn: (payload: AssignPlanPayload) => adminApi.assignPlanToOrganization(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-related", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-subs", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
      setIsPlanModalOpen(false);
    },
  });

  const mut = useMutation({
    mutationFn: adminApi.updateOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-related", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
    },
  });

  const users = relatedData?.data?.users ?? [];
  const owner = relatedData?.data?.owner;
  const totals = relatedData?.data?.totals;
  const invoices = relatedData?.data?.invoices ?? [];
  const orders = relatedData?.data?.orders ?? [];

  const usageChart = useMemo(
    () =>
      [
        { label: "Clients CRM", count: totals?.customers ?? 0 },
        { label: "Produits", count: totals?.products ?? 0 },
        { label: "Commandes", count: totals?.orders ?? 0 },
        { label: "Factures", count: totals?.invoices ?? 0 },
      ].filter((i) => i.count > 0),
    [totals],
  );

  const seatsUsed = orgMeta?.seats_used ?? users.length;
  const seatsIncluded = orgMeta?.seats_included ?? 0;
  const additionalSeats = orgMeta?.additional_seats ?? 0;
  const seatsTotal = orgMeta?.seats_total ?? (seatsIncluded > 0 ? seatsIncluded + additionalSeats : 0);
  const seatPct =
    seatsTotal > 0 ? Math.min(100, Math.round((seatsUsed / seatsTotal) * 100)) : null;
  const modulesCount = orgMeta?.enabled_modules?.length ?? orgMeta?.active_modules_count ?? 0;

  const tabCounts = useMemo(
    () => ({
      subscriptions: orgMeta?.plan_code ? 1 : 0,
      team: users.length,
    }),
    [orgMeta?.plan_code, users.length],
  );

  if (isRelatedLoading || isSubsLoading || isMetaLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-brand-purple-600" size={32} />
        <p className="text-sm font-medium text-slate-500">Chargement de l&apos;organisation…</p>
      </div>
    );
  }

  const org = relatedData?.data?.organization;
  if (!org) {
    return <div className="py-12 text-center font-bold text-rose-500">Organisation introuvable.</div>;
  }

  const planLabel = orgMeta?.plan_name || orgMeta?.plan_code || "Aucun plan";
  const statusLabel =
    orgMeta?.status === "trial" ? "Essai" : org.is_active ? "Actif" : "Suspendu";
  const ownerEmail =
    owner?.email ?? users.find((u) => u.is_owner)?.email ?? users[0]?.email ?? org.email ?? "";
  const logoUrl = resolveMediaUrl(org.logo_url);

  const openAssignPlan = () => {
    assignPlanMutation.reset();
    setIsPlanModalOpen(true);
  };

  return (
    <div className="grid animate-in fade-in slide-in-from-bottom-4 gap-6 duration-500">
      <header className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start gap-4">
          <button type="button" onClick={onBack} className="btn-secondary h-10 w-10 shrink-0 p-0">
            <ArrowLeft size={20} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <OrgAvatar name={org.name} logoUrl={logoUrl} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="m-0 truncate text-2xl font-bold text-slate-900 dark:text-slate-100">{org.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    org.is_active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {statusLabel}
                </span>
                {orgMeta?.plan_code ? (
                  <span className="rounded-full bg-brand-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-purple-700 dark:bg-brand-purple-900/30 dark:text-brand-purple-300">
                    {orgMeta.plan_code}
                  </span>
                ) : null}
              </div>
              <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Globe size={14} /> {org.slug}.codelab.bj
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> Créée {formatIsoDate(org.created_at)}
                </span>
                <span>
                  {org.country || "—"} · {org.currency || "XOF"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <QuickAction icon={<Plus size={15} />} label="Assigner un plan" onClick={openAssignPlan} />
          <QuickAction
            icon={org.is_active ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} />}
            label={org.is_active ? "Suspendre" : "Réactiver"}
            title={
              org.is_active
                ? "Désactive l'accès à l'organisation (connexion bloquée). Ne résilie pas le plan ni les modules."
                : "Réactive l'accès à l'organisation."
            }
            onClick={() => mut.mutate({ id: org.id, is_active: !org.is_active })}
            variant={org.is_active ? "danger" : "success"}
          />
          <QuickAction icon={<History size={15} />} label="Journaux d'audit" onClick={onOpenAudit} />
        </div>

        <OrgDetailTabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />
      </header>

      {activeTab === "overview" ? (
        <OverviewPanel
          orgMeta={orgMeta}
          planLabel={planLabel}
          totals={totals}
          usersCount={users.length}
          modulesCount={modulesCount}
          seatsUsed={seatsUsed}
          seatsTotal={seatsTotal}
          seatsIncluded={seatsIncluded}
          additionalSeats={additionalSeats}
          seatPct={seatPct}
          orders={orders}
          invoices={invoices}
          usageChart={usageChart}
          onOpenTeam={() => setActiveTab("team")}
          onOpenBilling={() => setActiveTab("billing")}
          onOpenSubscription={() => setActiveTab("subscriptions")}
        />
      ) : null}

      {activeTab === "subscriptions" ? (
        <SubscriptionPanel
          orgMeta={orgMeta}
          orgName={org.name}
          seatPct={seatPct}
          seatsUsed={seatsUsed}
          seatsTotal={seatsTotal}
          seatsIncluded={seatsIncluded}
          additionalSeats={additionalSeats}
          subs={subs?.results ?? []}
          onAssignPlan={openAssignPlan}
          onOpenBilling={() => setActiveTab("billing")}
        />
      ) : null}

      {activeTab === "team" ? <OrgTeamTab orgId={orgId} owner={owner} users={users} /> : null}

      {activeTab === "billing" ? (
        <>
          <OrgBusinessPlanRequestsPanel orgId={orgId} orgName={org.name} />
          <OrgBusinessInvoicesPanel
            orgId={orgId}
            orgName={org.name}
            defaultRecipientEmail={ownerEmail}
          />
        </>
      ) : null}

      {activeTab === "deployment" ? <OrgDedicatedInstancePanel orgId={orgId} /> : null}

      {isPlanModalOpen ? (
        <OrgAssignPlanModal
          orgName={org.name}
          currentPlanCode={orgMeta?.plan_code}
          plans={plans ?? []}
          isPending={assignPlanMutation.isPending}
          onClose={() => setIsPlanModalOpen(false)}
          onSubmit={(payload) => assignPlanMutation.mutateAsync(payload)}
        />
      ) : null}
    </div>
  );
}

function OrgAvatar({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-brand-purple-600 to-brand-magenta-500 p-0.5 shadow-lg">
      <div className="flex h-full w-full items-center justify-center rounded-[calc(1rem-2px)] bg-white dark:bg-slate-900">
        <Building2 size={26} className="text-brand-purple-600" />
      </div>
    </div>
  );
}

function OverviewPanel({
  orgMeta,
  planLabel,
  totals,
  usersCount,
  modulesCount,
  seatsUsed,
  seatsTotal,
  seatsIncluded,
  additionalSeats,
  seatPct,
  orders,
  invoices,
  usageChart,
  onOpenTeam,
  onOpenBilling,
  onOpenSubscription,
}: {
  orgMeta?: OrgMeta;
  planLabel: string;
  totals?: {
    customers?: number;
    products?: number;
    orders?: number;
    invoices?: number;
    users?: number;
  };
  usersCount: number;
  modulesCount: number;
  seatsUsed: number;
  seatsTotal: number;
  seatsIncluded: number;
  additionalSeats: number;
  seatPct: number | null;
  orders: { id: string; order_number?: string; status?: string }[];
  invoices: { id: string; invoice_number?: string; total?: string; status?: string }[];
  usageChart: { label: string; count: number }[];
  onOpenTeam: () => void;
  onOpenBilling: () => void;
  onOpenSubscription: () => void;
}) {
  const t = totals;
  const period = planPeriodProgress(orgMeta?.plan_starts_at, orgMeta?.plan_expires_at);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <KpiCard label="Utilisateurs" value={t?.users ?? usersCount} icon={<Users size={18} />} accent="purple" />
        <KpiCard
          label="Sièges"
          value={seatsTotal > 0 ? `${seatsUsed} / ${seatsTotal}` : seatsUsed}
          hint={
            seatsTotal > 0
              ? `${seatPct ?? 0} % utilisés${additionalSeats ? ` · +${additionalSeats} add-on` : ""}`
              : "Capacité non définie"
          }
          icon={<Users size={18} />}
          accent={seatPct != null && seatPct >= 90 ? "rose" : "blue"}
        />
        <KpiCard label="Clients CRM" value={t?.customers ?? 0} icon={<Users size={18} />} accent="blue" />
        <KpiCard label="Commandes" value={t?.orders ?? 0} icon={<ShoppingCart size={18} />} accent="emerald" />
        <KpiCard label="Factures" value={t?.invoices ?? 0} icon={<FileText size={18} />} accent="amber" />
        <KpiCard label="Modules actifs" value={modulesCount} icon={<Zap size={18} />} accent="purple" />
        <KpiCard label="Plan" value={planLabel} hint={orgMeta?.plan_code ? undefined : "Aucun plan"} icon={<Settings2 size={18} />} accent="slate" />
      </div>

      {orgMeta?.plan_code ? (
        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <CalendarDays size={14} /> Abonnement
              </h3>
              <p className="m-0 mt-2 text-sm text-slate-700 dark:text-slate-300">
                <strong>{orgMeta.plan_name ?? orgMeta.plan_code}</strong>
                {orgMeta.plan_billing_cycle ? ` · ${orgMeta.plan_billing_cycle === "yearly" ? "Annuel" : "Mensuel"}` : ""}
                {period ? (
                  <span className="text-slate-500">
                    {" "}
                    — {period.daysElapsed} j consommés · {period.daysRemaining} j restants
                  </span>
                ) : null}
              </p>
            </div>
            <button type="button" className="btn-secondary text-xs" onClick={onOpenSubscription}>
              Voir le détail
            </button>
          </div>
          {period ? (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{formatIsoDate(orgMeta.plan_starts_at ?? undefined)}</span>
                <span>{formatIsoDate(orgMeta.plan_expires_at ?? undefined)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-purple-500 transition-all"
                  style={{ width: `${period.elapsedPct}%` }}
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <BarChart3 size={14} /> Volume métier
          </h3>
          <p className="mb-4 text-[11px] text-slate-400">
            Répartition relative des enregistrements (pas l&apos;occupation des sièges).
          </p>
          {usageChart.length ? (
            <DistributionBars items={usageChart} />
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">Pas encore de données métier.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <Package size={14} /> Synthèse
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Produits" value={t?.products ?? 0} />
            <StatTile label="Clients" value={t?.customers ?? 0} />
            <StatTile label="Commandes" value={t?.orders ?? 0} />
            <StatTile label="Factures" value={t?.invoices ?? 0} />
          </div>
          {seatPct != null ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Sièges utilisés</span>
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                  {seatsUsed} / {seatsTotal}
                  {additionalSeats ? ` (${seatsIncluded} + ${additionalSeats})` : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    seatPct >= 90 ? "bg-rose-500" : seatPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${seatPct}%` }}
                />
              </div>
            </div>
          ) : null}
          <button type="button" className="btn-secondary mt-4 w-full text-xs" onClick={onOpenTeam}>
            Voir l&apos;équipe ({usersCount})
          </button>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentList
          title="Commandes récentes"
          icon={<ShoppingCart size={14} />}
          empty="Aucune commande."
          items={orders.slice(0, 5).map((o) => ({
            id: o.id,
            left: `#${o.order_number ?? o.id.slice(0, 8)}`,
            right: o.status ?? "—",
          }))}
        />
        <RecentList
          title="Factures récentes"
          icon={<FileText size={14} />}
          empty="Aucune facture."
          linkLabel="Facturation"
          onLink={onOpenBilling}
          items={invoices.slice(0, 5).map((inv) => ({
            id: inv.id,
            left: inv.invoice_number ?? inv.id.slice(0, 8),
            right: inv.total ? formatMoneyFromApi(inv.total) : "—",
          }))}
        />
      </div>
    </>
  );
}

function SubscriptionPanel({
  orgMeta,
  orgName,
  seatPct,
  seatsUsed,
  seatsTotal,
  seatsIncluded,
  additionalSeats,
  subs,
  onAssignPlan,
  onOpenBilling,
}: {
  orgMeta?: OrgMeta;
  orgName: string;
  seatPct: number | null;
  seatsUsed: number;
  seatsTotal: number;
  seatsIncluded: number;
  additionalSeats: number;
  subs: { id: string; status: string; ends_at?: string | null; module: { name: string } }[];
  onAssignPlan: () => void;
  onOpenBilling: () => void;
}) {
  const moduleRows = useMemo(() => {
    if (orgMeta?.enabled_modules?.length) {
      return orgMeta.enabled_modules.map((code) => ({
        id: code,
        status: orgMeta.status ?? orgMeta.plan_status ?? "active",
        ends_at: orgMeta.plan_expires_at ?? null,
        module: { name: MODULE_LABELS[code] ?? code.toUpperCase() },
      }));
    }
    return subs;
  }, [orgMeta, subs]);

  const period = planPeriodProgress(orgMeta?.plan_starts_at, orgMeta?.plan_expires_at);
  const isBusiness = orgMeta?.plan_code === "business";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <div className="grid gap-4">
        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <Settings2 size={14} /> Plan & sièges
          </h3>
          <div className="mb-4 rounded-xl bg-gradient-to-br from-brand-purple-50 to-white p-4 dark:from-brand-purple-950/30 dark:to-slate-900">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan actuel</p>
            <p className="m-0 mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {orgMeta?.plan_code ?? "Aucun"}
              {orgMeta?.plan_name ? (
                <span className="ml-1 text-sm font-medium text-slate-500">({orgMeta.plan_name})</span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill label={orgMeta?.plan_status ?? orgMeta?.status ?? "—"} />
              {orgMeta?.plan_billing_cycle ? (
                <StatusPill label={orgMeta.plan_billing_cycle === "yearly" ? "Annuel" : "Mensuel"} muted />
              ) : null}
            </div>
          </div>

          {period ? (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Période d&apos;abonnement</span>
                <span className="tabular-nums text-slate-500">
                  {period.daysElapsed} j / {period.daysTotal} j
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-purple-500 transition-all"
                  style={{ width: `${period.elapsedPct}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                  <p className="m-0 text-[10px] uppercase text-slate-400">Consommé</p>
                  <p className="m-0 font-bold text-slate-800 dark:text-slate-200">{period.daysElapsed} j</p>
                  <p className="m-0 text-[10px] text-slate-500">{formatIsoDate(orgMeta?.plan_starts_at ?? undefined)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                  <p className="m-0 text-[10px] uppercase text-slate-400">Restant</p>
                  <p className="m-0 font-bold text-slate-800 dark:text-slate-200">{period.daysRemaining} j</p>
                  <p className="m-0 text-[10px] text-slate-500">{formatIsoDate(orgMeta?.plan_expires_at ?? undefined)}</p>
                </div>
              </div>
            </div>
          ) : orgMeta?.plan_expires_at ? (
            <p className="mb-4 text-xs text-slate-500">
              Expire le {formatIsoDate(orgMeta.plan_expires_at)}
            </p>
          ) : null}

          {seatPct != null ? (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Sièges utilisés</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {seatsUsed} / {seatsTotal}
                  {additionalSeats ? ` (${seatsIncluded} inclus + ${additionalSeats} add-on)` : ""}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    seatPct >= 90 ? "bg-rose-500" : seatPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${seatPct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{seatPct} % de la capacité</p>
            </div>
          ) : (
            <p className="mb-4 text-xs text-slate-400">Capacité sièges non configurée.</p>
          )}

          <button type="button" className="btn-magenta mb-3 w-full text-xs" onClick={onAssignPlan}>
            <Plus size={14} className="mr-1 inline" /> Assigner / migrer un plan
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            <p className="m-0 flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-brand-purple-500" />
              <span>
                <strong>Starter / Pro</strong> : migration manuelle via ce formulaire (audit obligatoire).
                <br />
                <strong>Business</strong> : activation et renouvellement via facture + paiement (onglet Facturation).
                Une nouvelle facture payée prolonge la période et met à jour sièges / add-ons.
              </span>
            </p>
            {isBusiness ? (
              <button type="button" className="btn-secondary mt-3 w-full text-[11px]" onClick={onOpenBilling}>
                Émettre une facture Business
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="m-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Modules inclus — {orgName}
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-400">
            {moduleRows.length} module{moduleRows.length > 1 ? "s" : ""} actif{moduleRows.length > 1 ? "s" : ""} sur le plan{" "}
            {orgMeta?.plan_code ?? "—"}
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {moduleRows.length ? (
            moduleRows.map((sub) => (
              <article
                key={sub.id}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.module.name}</p>
                  <StatusPill label={sub.status} />
                </div>
                {sub.ends_at ? (
                  <p className="m-0 mt-2 text-[11px] text-slate-500">
                    Valide jusqu&apos;au {formatIsoDate(sub.ends_at)}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="col-span-full px-1 py-10 text-center text-sm text-slate-400 italic">Aucun module actif.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ label, muted }: { label: string; muted?: boolean }) {
  const normalized = label.toLowerCase();
  const active = normalized === "active" || normalized === "actif";
  const trial = normalized === "trial" || normalized === "essai";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        muted
          ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          : active
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            : trial
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

function RecentList({
  title,
  icon,
  items,
  empty,
  linkLabel,
  onLink,
}: {
  title: string;
  icon: ReactNode;
  items: { id: string; left: string; right: string }[];
  empty: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          {icon} {title}
        </h3>
        {linkLabel && onLink ? (
          <button type="button" className="btn-ghost px-2 py-1 text-[10px] font-bold" onClick={onLink}>
            {linkLabel}
          </button>
        ) : null}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">{item.left}</span>
            <span className="text-xs text-slate-500">{item.right}</span>
          </div>
        ))}
        {!items.length ? <p className="px-5 py-8 text-center text-xs text-slate-400">{empty}</p> : null}
      </div>
    </section>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  title,
  variant = "default",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  title?: string;
  variant?: "default" | "danger" | "success";
}) {
  const styles = {
    default: "btn-secondary",
    danger: "btn-secondary text-rose-600 hover:text-rose-700 dark:text-rose-400",
    success: "btn-secondary text-emerald-600 hover:text-emerald-700 dark:text-emerald-400",
  };
  return (
    <button
      type="button"
      title={title}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs ${styles[variant]}`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <p className="m-0 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="m-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
