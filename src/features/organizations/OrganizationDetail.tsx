import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Users,
  History,
  ShieldAlert,
  UserPlus,
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
  ExternalLink,
} from "lucide-react";
import { adminApi, type AssignPlanPayload } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";
import { formatMoneyFromApi } from "@/lib/money";
import { KpiCard, DistributionBars } from "@/features/dashboard/components/DashboardWidgets";
import { OrgBusinessInvoicesPanel } from "@/features/organizations/components/OrgBusinessInvoicesPanel";
import { OrgDedicatedInstancePanel } from "@/features/organizations/components/OrgDedicatedInstancePanel";
import { cn } from "@/lib/utils";

type OrganizationDetailProps = {
  orgId: string;
  onBack: () => void;
  onOpenSubscriptions: () => void;
  onOpenAssignPlan: () => void;
  onOpenBilling: () => void;
  onOpenAudit: () => void;
};

export function OrganizationDetail({
  orgId,
  onBack,
  onOpenSubscriptions,
  onOpenAssignPlan,
  onOpenBilling,
  onOpenAudit,
}: OrganizationDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "billing">("overview");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const queryClient = useQueryClient();

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
    users.find((u: { is_owner?: boolean; email?: string }) => u.is_owner)?.email ??
    users[0]?.email ??
    org.email ??
    "";

  return (
    <div className="grid animate-in fade-in slide-in-from-bottom-4 gap-6 duration-500">
      {/* En-tête type Stripe / Intercom */}
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

        {/* Actions rapides */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <QuickAction icon={<WalletCards size={15} />} label="Abonnements" onClick={onOpenSubscriptions} />
          <QuickAction icon={<Plus size={15} />} label="Assigner un plan" onClick={onOpenAssignPlan} />
          <QuickAction
            icon={org.is_active ? <ShieldAlert size={15} /> : <CheckCircle2 size={15} />}
            label={org.is_active ? "Suspendre" : "Réactiver"}
            onClick={() => mut.mutate({ id: org.id, is_active: !org.is_active })}
            variant={org.is_active ? "danger" : "success"}
          />
          <QuickAction icon={<Receipt size={15} />} label="Facturation Business" onClick={onOpenBilling} />
          <QuickAction icon={<History size={15} />} label="Journaux d'audit" onClick={onOpenAudit} />
        </div>

        <div className="mt-4 flex gap-1 border-t border-slate-100 pt-4 dark:border-slate-800">
          {(
            [
              { id: "overview" as const, label: "Aperçu" },
              { id: "billing" as const, label: "Facturation & déploiement" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-brand-purple-100 text-brand-purple-800 dark:bg-brand-purple-900/30 dark:text-brand-purple-200"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "billing" ? (
        <div className="grid gap-6">
          <OrgBusinessInvoicesPanel
            orgId={orgId}
            orgName={org.name}
            defaultRecipientEmail={ownerEmail}
          />
          <OrgDedicatedInstancePanel orgId={orgId} />
        </div>
      ) : (
        <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <KpiCard label="Utilisateurs" value={totals?.users ?? users.length} icon={<Users size={18} />} accent="purple" />
        <KpiCard label="Clients CRM" value={totals?.customers ?? 0} icon={<Users size={18} />} accent="blue" />
        <KpiCard label="Commandes" value={totals?.orders ?? 0} icon={<ShoppingCart size={18} />} accent="emerald" />
        <KpiCard label="Factures" value={totals?.invoices ?? 0} icon={<FileText size={18} />} accent="amber" />
        <KpiCard
          label="Modules actifs"
          value={orgMeta?.active_modules_count ?? subs?.results?.length ?? 0}
          icon={<Zap size={18} />}
          accent="purple"
        />
        <KpiCard
          label="Plan"
          value={planLabel}
          hint={orgMeta?.plan_code ? undefined : "Aucun plan assigné"}
          icon={<WalletCards size={18} />}
          accent="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche : licensing + sièges */}
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <Settings2 size={14} /> Licences & sièges
            </h3>
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
            <div className="space-y-2">
              {subs?.results?.length ? (
                subs.results.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.module.name}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400">{sub.status}</p>
                    </div>
                    {sub.ends_at ? (
                      <span className="text-[10px] text-slate-500">→ {formatIsoDate(sub.ends_at)}</span>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-slate-400 italic">Aucun module souscrit.</p>
              )}
            </div>
            <button type="button" className="btn-secondary mt-4 w-full text-xs" onClick={() => setIsPlanModalOpen(true)}>
              <Plus size={14} className="mr-1 inline" /> Assigner un plan
            </button>
          </section>

          <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <BarChart3 size={14} /> Volume métier
            </h3>
            {usageChart.length ? (
              <DistributionBars items={usageChart} />
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">Pas encore de données métier.</p>
            )}
          </section>
        </div>

        {/* Colonne droite : utilisateurs + activité */}
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <Users size={14} /> Équipe ({users.length})
              </h3>
              <button type="button" className="btn-secondary px-3 py-1.5 text-xs">
                <UserPlus size={14} className="mr-1 inline" /> Inviter
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-5 py-3 text-left">Utilisateur</th>
                    <th className="px-5 py-3 text-left">Rôle</th>
                    <th className="px-5 py-3 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3">
                        <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                        <p className="m-0 text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">
                          {user.is_superuser ? "Super Admin" : user.is_staff ? "Staff" : "Membre"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={user.is_active ? "text-emerald-600" : "text-slate-400"}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!users.length ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400">
                        Aucun utilisateur rattaché.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <ShoppingCart size={14} /> Commandes récentes
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.slice(0, 5).map((order: { id: string; order_number?: string; total?: string; status?: string }) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">#{order.order_number ?? order.id.slice(0, 8)}</span>
                    <span className="text-xs text-slate-500">{order.status ?? "—"}</span>
                  </div>
                ))}
                {!orders.length ? (
                  <p className="px-5 py-8 text-center text-xs text-slate-400">Aucune commande.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <FileText size={14} /> Factures récentes
                </h3>
                <button type="button" className="btn-ghost px-2 py-1 text-[10px] font-bold" onClick={() => setActiveTab("billing")}>
                  Facturation Business <ExternalLink size={12} className="ml-0.5 inline" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.slice(0, 5).map((inv: { id: string; invoice_number?: string; total?: string; status?: string }) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {inv.invoice_number ?? inv.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {inv.total ? formatMoneyFromApi(inv.total) : "—"}
                    </span>
                  </div>
                ))}
                {!invoices.length ? (
                  <p className="px-5 py-8 text-center text-xs text-slate-400">Aucune facture.</p>
                ) : null}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <Package size={14} /> Synthèse produits & clients
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Produits" value={totals?.products ?? 0} />
              <StatTile label="Clients" value={totals?.customers ?? 0} />
              <StatTile label="Commandes" value={totals?.orders ?? 0} />
              <StatTile label="Factures" value={totals?.invoices ?? 0} />
            </div>
          </section>
        </div>
      </div>
        </>
      )}

      {isPlanModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assigner un plan</h3>
                <p className="text-sm text-slate-500">Offre commerciale pour {org.name}</p>
              </div>
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className="btn-ghost h-9 w-9 p-0">
                ×
              </button>
            </div>
            <div className="grid gap-3">
              {plans?.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => assignPlanMutation.mutate({ plan_id: plan.id })}
                  disabled={assignPlanMutation.isPending}
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
      ) : null}
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
