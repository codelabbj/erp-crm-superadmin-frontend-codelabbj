import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  Power,
  WalletCards,
} from "lucide-react";
import { adminApi, type AdminOrganization } from "../../lib/adminApi";
import { orgSubscriptionsPath } from "@/lib/orgNavigation";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";
import { FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";
import { downloadCsv } from "@/lib/exportCsv";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { usePlatformPerms } from "@/hooks/usePlatformPerms";

function ownerDisplayName(owner: AdminOrganization["owner"]): string {
  if (!owner) return "Propriétaire inconnu";
  const name = owner.full_name?.trim();
  return name || owner.email || "Propriétaire inconnu";
}

function paymentSourceLabel(source?: string | null): string {
  switch (source) {
    case "pal":
      return "PAL (payé)";
    case "magic":
      return "Démo MAGIC";
    case "admin_gifted":
      return "Offert / admin";
    case "any_paid":
      return "Payé";
    case "unpaid":
      return "Sans paiement";
    default:
      return "—";
  }
}

function planStatusLabel(org: AdminOrganization): string {
  if (!org.plan_code) return "Sans plan";
  const status = org.plan_status || org.status || "";
  switch (status) {
    case "active":
      return "Actif";
    case "trial":
      return "Essai";
    case "expired":
      return "Expiré";
    case "past_due":
      return "Impayé / past due";
    case "suspended":
      return "Suspendu";
    default:
      return status || "—";
  }
}

function OrgRowActions({
  org,
  canWriteOrgs,
  onView,
  onSubscriptions,
  onToggleActive,
}: {
  org: AdminOrganization;
  canWriteOrgs: boolean;
  onView: () => void;
  onSubscriptions: () => void;
  onToggleActive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-secondary h-8 w-8 p-0"
        aria-label="Actions rapides"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <ul className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                onView();
                setOpen(false);
              }}
            >
              <Eye size={14} /> Voir le détail
            </button>
          </li>
          {canWriteOrgs ? (
            <>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onSubscriptions();
                    setOpen(false);
                  }}
                >
                  <WalletCards size={14} /> Gérer le plan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onToggleActive();
                    setOpen(false);
                  }}
                >
                  <Power size={14} /> {org.is_active ? "Suspendre" : "Réactiver"}
                </button>
              </li>
            </>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function Organizations() {
  const navigate = useNavigate();
  const { canWriteOrgs } = usePlatformPerms();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [paymentSource, setPaymentSource] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [orgActiveFilter, setOrgActiveFilter] = useState("");
  const [expiringDays, setExpiringDays] = useState("7");
  const [exporting, setExporting] = useState(false);
  const debouncedQ = useDebouncedValue(q);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(30);
  const [feedback, setFeedback] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", is_active: true });

  const { data: plans } = useQuery({
    queryKey: ["platform-plans"],
    queryFn: () => adminApi.licensingPlans(),
  });

  const listParams = {
    q: debouncedQ || undefined,
    limit: pageSize,
    offset,
    sort,
    status: subscriptionStatus || undefined,
    payment_source: paymentSource || undefined,
    plan: planFilter || undefined,
    is_active: orgActiveFilter || undefined,
    expiring_days:
      subscriptionStatus === "expiring_soon" ? Number(expiringDays) || 7 : undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "orgs",
      debouncedQ,
      sort,
      page,
      subscriptionStatus,
      paymentSource,
      planFilter,
      orgActiveFilter,
      expiringDays,
    ],
    queryFn: () => adminApi.organizations(listParams),
  });
  const total = paginatedCount(data);
  const qc = useQueryClient();

  const { ask, close, renderDialog } = useConfirmDialog();

  const mut = useMutation({
    mutationFn: adminApi.updateOrganization,
    onSuccess: async () => {
      setFeedback("Organisation mise à jour.");
      await qc.invalidateQueries({ queryKey: ["orgs"] });
    },
    onError: (e) => setFeedback(getErrorMessage(e)),
    onSettled: () => close(),
  });

  const createMut = useMutation({
    mutationFn: adminApi.createOrganization,
    onSuccess: async () => {
      setFeedback("Organisation créée.");
      setIsModalOpen(false);
      setModalError("");
      setNewOrg({ name: "", slug: "", is_active: true });
      await qc.invalidateQueries({ queryKey: ["orgs"] });
    },
    onError: (e) => setModalError(getErrorMessage(e)),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const limit = 500;
      const all: AdminOrganization[] = [];
      let offsetExport = 0;
      let count = 0;

      do {
        const batch = await adminApi.organizations({
          ...listParams,
          limit,
          offset: offsetExport,
        });
        all.push(...(batch.results ?? []));
        count = batch.count ?? all.length;
        offsetExport += limit;
      } while (all.length < count && offsetExport < count);

      downloadCsv(
        `organisations-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Nom",
          "Propriétaire",
          "Slug",
          "Pays",
          "Devise",
          "Membres",
          "Plan",
          "Statut plan",
          "Sièges utilisés",
          "Sièges inclus",
          "Sièges additionnels",
          "Sièges total",
          "Paiement",
          "Expire le",
          "Créée le",
          "Actif",
        ],
        all.map((o) => [
          o.name,
          ownerDisplayName(o.owner),
          o.slug,
          o.country,
          o.currency,
          o.members_count,
          o.plan_code || "",
          planStatusLabel(o),
          o.seats_used ?? "",
          o.seats_included ?? "",
          o.additional_seats ?? "",
          o.seats_total ?? "",
          paymentSourceLabel(o.payment_source),
          formatIsoDate(o.plan_expires_at ?? undefined),
          formatIsoDate(o.created_at),
          o.is_active ? "Oui" : "Non",
        ]),
      );
      setFeedback(`${all.length} organisation(s) exportée(s).`);
    } catch (e) {
      setFeedback(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSubscriptionStatus("");
    setPaymentSource("");
    setPlanFilter("");
    setOrgActiveFilter("");
    setExpiringDays("7");
    resetPage();
  };

  const hasAdvancedFilters = Boolean(
    subscriptionStatus || paymentSource || planFilter || orgActiveFilter,
  );

  return (
    <ListPageShell>
      <PageHeader
        title="Organisations"
        description="Annuaire des tenants — aperçu plan, sièges et paiement. Pour assigner un plan ou ajouter des sièges : Abonnements."
        actions={
          canWriteOrgs ? (
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary px-3 py-1.5 text-xs">
              <Plus size={14} className="mr-1 inline" />
              Nouvelle organisation
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2 rounded-xl bg-neutral-1 p-2 ring-1 ring-neutral-4 dark:bg-neutral-8/40">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              resetPage();
            }}
            placeholder="Nom, slug, propriétaire…"
            className="min-w-[180px] flex-1"
          />
          <FilterSelect
            value={sort}
            onChange={(v) => {
              setSort(v);
              resetPage();
            }}
            options={[
              { value: "-created_at", label: "Plus récentes" },
              { value: "created_at", label: "Plus anciennes" },
              { value: "name", label: "Nom A→Z" },
              { value: "-name", label: "Nom Z→A" },
              { value: "members_count", label: "Membres ↑" },
              { value: "-members_count", label: "Membres ↓" },
              { value: "plan_expires_at", label: "Expiration ↑" },
              { value: "-plan_expires_at", label: "Expiration ↓" },
            ]}
            className="h-9 w-[150px] shrink-0"
          />
          <button
            type="button"
            className="btn-secondary inline-flex h-9 shrink-0 items-center gap-1.5 px-3 text-xs whitespace-nowrap"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={subscriptionStatus}
            onChange={(v) => {
              setSubscriptionStatus(v);
              resetPage();
            }}
            placeholder="Statut abonnement"
            options={[
              { value: "active", label: "Abonnement actif" },
              { value: "trial", label: "Essai" },
              { value: "expiring_soon", label: "Bientôt expiré" },
              { value: "expired", label: "Expiré / past due" },
              { value: "suspended", label: "Plan suspendu" },
              { value: "no_plan", label: "Sans plan" },
            ]}
            className="h-9 w-[180px]"
          />
          {subscriptionStatus === "expiring_soon" ? (
            <FilterSelect
              value={expiringDays}
              onChange={(v) => {
                setExpiringDays(v);
                resetPage();
              }}
              options={[
                { value: "3", label: "Sous 3 jours" },
                { value: "7", label: "Sous 7 jours" },
                { value: "14", label: "Sous 14 jours" },
                { value: "30", label: "Sous 30 jours" },
              ]}
              className="h-9 w-[140px]"
            />
          ) : null}
          <FilterSelect
            value={paymentSource}
            onChange={(v) => {
              setPaymentSource(v);
              resetPage();
            }}
            placeholder="Source paiement"
            options={[
              { value: "pal", label: "Payé via PAL (API)" },
              { value: "admin_gifted", label: "Offert / assigné admin" },
              { value: "magic", label: "Paiement démo MAGIC" },
              { value: "any_paid", label: "Tout paiement succès" },
              { value: "unpaid", label: "Sans paiement" },
            ]}
            className="h-9 w-[200px]"
          />
          <FilterSelect
            value={planFilter}
            onChange={(v) => {
              setPlanFilter(v);
              resetPage();
            }}
            placeholder="Plan"
            options={[
              { value: "none", label: "Aucun plan" },
              ...(plans ?? []).map((plan) => ({
                value: plan.code,
                label: `${plan.name} (${plan.code})`,
              })),
            ]}
            className="h-9 w-[180px]"
          />
          <FilterSelect
            value={orgActiveFilter}
            onChange={(v) => {
              setOrgActiveFilter(v);
              resetPage();
            }}
            placeholder="Org active ?"
            options={[
              { value: "true", label: "Org active" },
              { value: "false", label: "Org suspendue" },
            ]}
            className="h-9 w-[150px]"
          />
          {hasAdvancedFilters ? (
            <button type="button" className="btn-ghost h-9 px-3 text-xs" onClick={resetFilters}>
              Réinitialiser filtres
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? <p className="text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="text-xs text-text-muted dark:text-slate-400">Chargement…</p> : null}
      {isError ? <p className="text-sm text-red-700">{getErrorMessage(error)}</p> : null}

      <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Plan</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Abonnement</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Sièges</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Paiement</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Expire</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Org</th>
              <th className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                onClick={() => navigate(`/organizations/${o.id}`)}
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-purple-100 font-bold text-brand-purple-700 dark:bg-brand-purple-900/40 dark:text-brand-purple-300">
                      {o.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 truncate font-semibold text-slate-800 dark:text-slate-200">{o.name}</p>
                      <p className="m-0 truncate text-xs text-slate-600 dark:text-slate-400">
                        {ownerDisplayName(o.owner)}
                      </p>
                      <code className="text-[11px] text-slate-500">{o.slug}</code>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {o.plan_code || "Aucun"}
                  </span>
                  {o.plan_name ? (
                    <p className="m-0 mt-0.5 max-w-[140px] truncate text-[11px] text-slate-500">{o.plan_name}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{planStatusLabel(o)}</td>
                <td className="px-3 py-3">
                  <p className="m-0 tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {o.seats_used ?? 0} / {o.seats_total ?? o.seats_included ?? 0}
                  </p>
                  <p className="m-0 text-[11px] text-slate-500">
                    inclus {o.seats_included ?? 0}
                    {(o.additional_seats ?? 0) > 0 ? ` +${o.additional_seats}` : ""}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      o.payment_source === "pal"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : o.payment_source === "admin_gifted"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : o.payment_source === "magic"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {paymentSourceLabel(o.payment_source)}
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                  {formatIsoDate(o.plan_expires_at ?? undefined)}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      o.is_active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {o.is_active ? "Actif" : "Suspendu"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <OrgRowActions
                    org={o}
                    canWriteOrgs={canWriteOrgs}
                    onView={() => navigate(`/organizations/${o.id}`)}
                    onSubscriptions={() => navigate(orgSubscriptionsPath(o.id))}
                    onToggleActive={() =>
                      ask({
                        description: o.is_active
                          ? `Suspendre l'organisation « ${o.name} » ? L'accès sera bloqué pour tous les utilisateurs.`
                          : `Réactiver l'organisation « ${o.name} » ?`,
                        danger: o.is_active,
                        confirmText: o.is_active ? "Suspendre" : "Réactiver",
                        action: () => mut.mutate({ id: o.id, is_active: !o.is_active }),
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nouvelle organisation</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
                ×
              </button>
            </div>
            {modalError ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {modalError}
              </div>
            ) : null}
            <div className="space-y-4">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                Nom
                <input
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="ex: Acme Corp"
                  className="w-full"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                Slug
                <input
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  placeholder="ex: acme-corp"
                  className="w-full"
                />
              </label>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">
                Annuler
              </button>
              <button
                type="button"
                disabled={createMut.isPending || !newOrg.name || !newOrg.slug}
                onClick={() => {
                  setModalError("");
                  createMut.mutate(newOrg);
                }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDialog(mut.isPending)}
    </ListPageShell>
  );
}
