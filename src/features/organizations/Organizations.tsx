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

function ownerDisplayName(owner: AdminOrganization["owner"]): string {
  if (!owner) return "Propriétaire inconnu";
  const name = owner.full_name?.trim();
  return name || owner.email || "Propriétaire inconnu";
}

function OrgRowActions({
  org,
  onView,
  onSubscriptions,
  onToggleActive,
}: {
  org: AdminOrganization;
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
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                onSubscriptions();
                setOpen(false);
              }}
            >
              <WalletCards size={14} /> Abonnements
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
        </ul>
      ) : null}
    </div>
  );
}

export function Organizations() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [exporting, setExporting] = useState(false);
  const debouncedQ = useDebouncedValue(q);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(30);
  const [feedback, setFeedback] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", is_active: true });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orgs", debouncedQ, sort, page],
    queryFn: () =>
      adminApi.organizations({
        q: debouncedQ || undefined,
        limit: pageSize,
        offset,
        sort,
      }),
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
          q: debouncedQ || undefined,
          sort,
          limit,
          offset: offsetExport,
        });
        all.push(...(batch.results ?? []));
        count = batch.count ?? all.length;
        offsetExport += limit;
      } while (all.length < count && offsetExport < count);

      downloadCsv(
        `organisations-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Nom", "Propriétaire", "Slug", "Pays", "Devise", "Membres", "Créée le", "Actif"],
        all.map((o) => [
          o.name,
          ownerDisplayName(o.owner),
          o.slug,
          o.country,
          o.currency,
          o.members_count,
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

  return (
    <ListPageShell>
      <PageHeader
        title="Organisations"
        description="Tenants de la plateforme — recherche, tri, export et actions rapides."
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary px-3 py-1.5 text-xs">
            <Plus size={14} className="mr-1 inline" />
            Nouvelle organisation
          </button>
        }
      />

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-xl bg-neutral-1 p-2 ring-1 ring-neutral-4 dark:bg-neutral-8/40">
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

      {feedback ? <p className="text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="text-xs text-text-muted dark:text-slate-400">Chargement…</p> : null}
      {isError ? <p className="text-sm text-red-700">{getErrorMessage(error)}</p> : null}

      <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Pays</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Devise</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Membres</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Créée</th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">Statut</th>
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
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{o.country || "—"}</td>
                <td className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{o.currency || "—"}</td>
                <td className="px-3 py-3 tabular-nums text-slate-800 dark:text-slate-200">{o.members_count}</td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{formatIsoDate(o.created_at)}</td>
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
