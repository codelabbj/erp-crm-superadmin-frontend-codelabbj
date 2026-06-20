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
  WalletCards,
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
  Receipt,
} from "lucide-react";
import { adminApi, type AssignPlanPayload, type OrganizationDetail as OrgMeta } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";
import { formatMoneyFromApi } from "@/lib/money";
import { KpiCard, DistributionBars } from "@/features/dashboard/components/DashboardWidgets";
import { OrgBusinessInvoicesPanel } from "@/features/organizations/components/OrgBusinessInvoicesPanel";
import { OrgDedicatedInstancePanel } from "@/features/organizations/components/OrgDedicatedInstancePanel";
import { OrgDetailTabBar } from "@/features/organizations/components/OrgDetailTabBar";
import { OrgTeamTab } from "@/features/organizations/components/tabs/OrgTeamTab";
import { type OrgDetailTab, readOrgDetailTab } from "@/lib/orgNavigation";

type OrganizationDetailProps = {
  orgId: string;
  onBack: () => void;
  onOpenSubscriptions: () => void;
  onOpenAssignPlan: () => void;
  onOpenAudit: () => void;
};

export function OrganizationDetail({
  orgId,
  onBack,
  onOpenSubscriptions,
  onOpenAssignPlan,
  onOpenAudit,
}: OrganizationDetailProps) {
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
        { label: "Utilisateurs", count: totals?.users ?? users.length },
      ].filter((i) => i.count > 0),
    [totals, users.length],
  );

  const seatsUsed = orgMeta?.seats_used ?? users.length;
  const seatsIncluded = orgMeta?.seats_included ?? 0;
  const seatPct =
    seatsIncluded > 0 ? Math.min(100, Math.round((seatsUsed / seatsIncluded) * 100)) : null;

  const tabCounts = useMemo(
    () => ({
      subscriptions: subs?.results?.length ?? 0,
      team: users.length,
    }),
    [subs?.results?.length, users.length],
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

  return (
    <div className="grid animate-in fade-in slide-in-from-bottom-4 gap-6 duration-500">
      <header className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start gap-4">
          <button type="button" onClick={onBack} className="btn-secondary h-10 w-10 shrink-0 p-0">
            <ArrowLeft size={20} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-brand-purple-600 to-brand-magenta-500 p-0.5 shadow-lg">
              <div className="flex h-full w-full items-center justify-center rounded-[calc(1rem-2px)] bg-white dark:bg-slate-900">
                <Building2 size={26} className="text-brand-purple-600" />
              </div>
            </div>
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
          <QuickAction icon={<WalletCards size={15} />} label="Abonnements" onClick={onOpenSubscriptions} />
          <QuickAction icon={<Plus size={15} />} label="Assigner un plan" onClick={onOpenAssignPlan} />
          <QuickAction
            icon={org.is_active ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} />}
            label={org.is_active ? "Suspendre" : "Réactiver"}
            onClick={() => mut.mutate({ id: org.id, is_active: !org.is_active })}
            variant={org.is_active ? "danger" : "success"}
          />
          <QuickAction icon={<Receipt size={15} />} label="Facturation Business" onClick={() => setActiveTab("billing")} />
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
          subsCount={subs?.results?.length ?? 0}
          orders={orders}
          invoices={invoices}
          usageChart={usageChart}
          onOpenTeam={() => setActiveTab("team")}
          onOpenBilling={() => setActiveTab("billing")}
        />
      ) : null}

      {activeTab === "subscriptions" ? (
        <SubscriptionsPanel
          orgMeta={orgMeta}
          orgName={org.name}
          seatPct={seatPct}
          seatsUsed={seatsUsed}
          seatsIncluded={seatsIncluded}
          subs={subs?.results ?? []}
          onAssignPlan={() => setIsPlanModalOpen(true)}
        />
      ) : null}

      {activeTab === "team" ? <OrgTeamTab orgId={orgId} owner={owner} users={users} /> : null}

      {activeTab === "billing" ? (
        <OrgBusinessInvoicesPanel
          orgId={orgId}
          orgName={org.name}
          defaultRecipientEmail={ownerEmail}
        />
      ) : null}

      {activeTab === "deployment" ? <OrgDedicatedInstancePanel orgId={orgId} /> : null}

      {isPlanModalOpen ? (
        <PlanModal
          orgName={org.name}
          plans={plans ?? []}
          isPending={assignPlanMutation.isPending}
          onClose={() => setIsPlanModalOpen(false)}
          onSelect={(planId) => assignPlanMutation.mutate({ plan_id: planId })}
        />
      ) : null}
    </div>
  );
}

function OverviewPanel({
  orgMeta,
  planLabel,
  totals,
  usersCount,
  subsCount,
  orders,
  invoices,
  usageChart,
  onOpenTeam,
  onOpenBilling,
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
  subsCount: number;
  orders: { id: string; order_number?: string; status?: string }[];
  invoices: { id: string; invoice_number?: string; total?: string; status?: string }[];
  usageChart: { label: string; count: number }[];
  onOpenTeam: () => void;
  onOpenBilling: () => void;
}) {
  const t = totals;

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <KpiCard label="Utilisateurs" value={t?.users ?? usersCount} icon={<Users size={18} />} accent="purple" />
        <KpiCard label="Clients CRM" value={t?.customers ?? 0} icon={<Users size={18} />} accent="blue" />
        <KpiCard label="Commandes" value={t?.orders ?? 0} icon={<ShoppingCart size={18} />} accent="emerald" />
        <KpiCard label="Factures" value={t?.invoices ?? 0} icon={<FileText size={18} />} accent="amber" />
        <KpiCard label="Modules actifs" value={orgMeta?.active_modules_count ?? subsCount} icon={<Zap size={18} />} accent="purple" />
        <KpiCard label="Plan" value={planLabel} hint={orgMeta?.plan_code ? undefined : "Aucun plan"} icon={<WalletCards size={18} />} accent="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <BarChart3 size={14} /> Volume métier
          </h3>
          {usageChart.length ? <DistributionBars items={usageChart} /> : (
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
          linkLabel="Facturation Business"
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

function SubscriptionsPanel({
  orgMeta,
  orgName,
  seatPct,
  seatsUsed,
  seatsIncluded,
  subs,
  onAssignPlan,
}: {
  orgMeta?: OrgMeta;
  orgName: string;
  seatPct: number | null;
  seatsUsed: number;
  seatsIncluded: number;
  subs: { id: string; status: string; ends_at?: string | null; module: { name: string } }[];
  onAssignPlan: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
          <Settings2 size={14} /> Plan & sièges
        </h3>
        <p className="m-0 mb-3 text-sm text-slate-700 dark:text-slate-300">
          Plan actuel : <strong>{orgMeta?.plan_code ?? "Aucun"}</strong>
          {orgMeta?.plan_name ? ` (${orgMeta.plan_name})` : ""}
        </p>
        {seatPct != null ? (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-500">Sièges utilisés</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {seatsUsed} / {seatsIncluded}
                {orgMeta?.additional_seats ? ` (+${orgMeta.additional_seats})` : ""}
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
            <p className="mt-1 text-[11px] text-slate-500">{seatPct} % de capacité</p>
          </div>
        ) : (
          <p className="mb-4 text-xs text-slate-400">Capacité sièges non configurée.</p>
        )}
        <button type="button" className="btn-magenta w-full text-xs" onClick={onAssignPlan}>
          <Plus size={14} className="mr-1 inline" /> Assigner un plan
        </button>
      </section>

      <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="m-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Modules souscrits — {orgName}
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {subs.length ? (
            subs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="m-0 text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.module.name}</p>
                  <p className="m-0 text-[10px] font-bold uppercase text-slate-400">{sub.status}</p>
                </div>
                {sub.ends_at ? (
                  <span className="text-xs text-slate-500">Expire {formatIsoDate(sub.ends_at)}</span>
                ) : null}
              </div>
            ))
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-400 italic">Aucun module souscrit.</p>
          )}
        </div>
      </section>
    </div>
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

function PlanModal({
  orgName,
  plans,
  isPending,
  onClose,
  onSelect,
}: {
  orgName: string;
  plans: { id: string; name: string; limits: { included_seats: number }; price_monthly: string | number }[];
  isPending: boolean;
  onClose: () => void;
  onSelect: (planId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assigner un plan</h3>
            <p className="text-sm text-slate-500">Offre pour {orgName}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0">
            ×
          </button>
        </div>
        <div className="grid gap-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              disabled={isPending}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-purple-400 hover:bg-brand-purple-50/50 dark:border-slate-700 dark:hover:bg-brand-purple-900/10"
            >
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</h4>
                <p className="text-xs text-slate-500">{plan.limits.included_seats} sièges inclus</p>
              </div>
              <p className="text-lg font-bold text-brand-purple-600">{formatMoneyFromApi(plan.price_monthly)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
}) {
  const styles = {
    default: "btn-secondary",
    danger: "btn-secondary text-rose-600 hover:text-rose-700 dark:text-rose-400",
    success: "btn-secondary text-emerald-600 hover:text-emerald-700 dark:text-emerald-400",
  };
  return (
    <button type="button" className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs ${styles[variant]}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
      <p className="m-0 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="m-0 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
