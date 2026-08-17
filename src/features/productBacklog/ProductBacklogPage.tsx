import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Map, Plus, Trash2, X } from "lucide-react";
import { adminApi, type ProductBacklogItem } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS = [
  { value: "idea", label: "Idées" },
  { value: "planned", label: "Prévu" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Livré" },
  { value: "dropped", label: "Abandonné" },
] as const;

const HORIZON_OPTIONS = [
  { value: "now", label: "Maintenant" },
  { value: "next", label: "Ensuite" },
  { value: "later", label: "Plus tard" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "critical", label: "Critique" },
];

function horizonLabel(value: string) {
  return HORIZON_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function priorityLabel(value: string) {
  return PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function priorityClass(value: string) {
  if (value === "critical") return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  if (value === "high") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (value === "low") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
}

const emptyDraft = {
  title: "",
  description: "",
  status: "idea",
  horizon: "later",
  priority: "medium",
  category: "",
  source_url: "",
};

export function ProductBacklogPage() {
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [horizonFilter, setHorizonFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickHorizon, setQuickHorizon] = useState("later");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [selected, setSelected] = useState<ProductBacklogItem | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const listQuery = useQuery({
    queryKey: ["product-backlog", search, horizonFilter, priorityFilter],
    queryFn: () =>
      adminApi.productBacklog({
        q: search || undefined,
        horizon: horizonFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 200,
      }),
  });

  const items = listQuery.data?.results ?? [];

  const byStatus = useMemo(() => {
    const map: Record<string, ProductBacklogItem[]> = {};
    for (const col of STATUS_COLUMNS) map[col.value] = [];
    for (const item of items) {
      (map[item.status] ?? map.idea).push(item);
    }
    return map;
  }, [items]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["product-backlog"] });

  const createMut = useMutation({
    mutationFn: (payload: Partial<ProductBacklogItem> & { title: string }) =>
      adminApi.createProductBacklogItem(payload),
    onSuccess: () => {
      setQuickTitle("");
      setIsCreating(false);
      setDraft(emptyDraft);
      setFormError("");
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; data: Partial<ProductBacklogItem> }) =>
      adminApi.updateProductBacklogItem(payload.id, payload.data),
    onSuccess: (data) => {
      setSelected(data);
      setDraft({
        title: data.title,
        description: data.description,
        status: data.status,
        horizon: data.horizon,
        priority: data.priority,
        category: data.category,
        source_url: data.source_url,
      });
      setFormError("");
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteProductBacklogItem(id),
    onSuccess: () => {
      setSelected(null);
      close();
      void refresh();
    },
    onError: (err: unknown) => setFormError(getErrorMessage(err)),
  });

  const openItem = (item: ProductBacklogItem) => {
    setSelected(item);
    setIsCreating(false);
    setFormError("");
    setDraft({
      title: item.title,
      description: item.description,
      status: item.status,
      horizon: item.horizon,
      priority: item.priority,
      category: item.category,
      source_url: item.source_url,
    });
  };

  const openCreate = () => {
    setSelected(null);
    setIsCreating(true);
    setFormError("");
    setDraft({ ...emptyDraft, title: quickTitle, horizon: quickHorizon, priority: quickPriority });
  };

  const submitQuick = () => {
    const title = quickTitle.trim();
    if (!title) return;
    createMut.mutate({
      title,
      horizon: quickHorizon,
      priority: quickPriority,
      status: "idea",
    });
  };

  return (
    <ListPageShell>
      <PageHeader
        title="Backlog & roadmap"
        description="Toutes les idées et grandes lignes futures OwoDesk, pour ne plus les oublier."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle idée
          </button>
        }
      />

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-4 bg-neutral-1 p-3 dark:border-neutral-6"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuick();
        }}
      >
        <label className="min-w-[220px] flex-1 text-xs font-medium text-neutral-7">
          Capture rapide
          <input
            className="input mt-1 w-full"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Ex. WMS entrepôt, 2FA, facturation FEC Burkina…"
          />
        </label>
        <FilterSelect value={quickHorizon} onChange={setQuickHorizon} options={HORIZON_OPTIONS} />
        <FilterSelect value={quickPriority} onChange={setQuickPriority} options={PRIORITY_OPTIONS} />
        <button type="submit" className="btn-secondary h-9" disabled={!quickTitle.trim() || createMut.isPending}>
          Ajouter
        </button>
      </form>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Titre, description, catégorie…" />
        <FilterSelect
          value={horizonFilter}
          onChange={setHorizonFilter}
          placeholder="Tous les horizons"
          options={HORIZON_OPTIONS}
        />
        <FilterSelect
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="Toutes les priorités"
          options={PRIORITY_OPTIONS}
        />
      </FilterBar>

      {listQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-6">Chargement…</p>
      ) : listQuery.isError ? (
        <p className="py-8 text-center text-sm text-danger-1">{getErrorMessage(listQuery.error)}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-5">
          {STATUS_COLUMNS.map((col) => (
            <section key={col.value} className="min-h-[240px] rounded-xl bg-neutral-1 p-2 dark:bg-neutral-8/40">
              <h3 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-neutral-6">
                {col.label}
                <span className="rounded-full bg-neutral-0 px-1.5 py-0.5 text-[10px] dark:bg-neutral-9">
                  {byStatus[col.value]?.length ?? 0}
                </span>
              </h3>
              <div className="space-y-2">
                {(byStatus[col.value] ?? []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "w-full rounded-lg border border-neutral-4 bg-neutral-0 p-3 text-left transition hover:border-primary-3 dark:border-neutral-6",
                      selected?.id === item.id ? "ring-2 ring-primary-3" : "",
                    )}
                  >
                    <p className="text-sm font-medium text-neutral-9 dark:text-neutral-10">{item.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", priorityClass(item.priority))}>
                        {priorityLabel(item.priority)}
                      </span>
                      <span className="rounded-md bg-neutral-2 px-1.5 py-0.5 text-[10px] text-neutral-7 dark:bg-neutral-7">
                        {horizonLabel(item.horizon)}
                      </span>
                      {item.category ? (
                        <span className="rounded-md bg-neutral-2 px-1.5 py-0.5 text-[10px] text-neutral-7 dark:bg-neutral-7">
                          {item.category}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected || isCreating ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 sm:p-4">
          <aside className="flex h-full w-full max-w-lg flex-col bg-neutral-0 shadow-2xl dark:bg-neutral-9">
            <header className="flex items-start justify-between border-b border-neutral-4 px-5 py-4 dark:border-neutral-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-neutral-6">
                  <Map className="h-3.5 w-3.5" />
                  {isCreating ? "Nouvelle idée" : "Éditer l’idée"}
                </p>
                <h2 className="text-lg font-bold text-neutral-9 dark:text-neutral-10">
                  {draft.title || "Sans titre"}
                </h2>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setSelected(null);
                  setIsCreating(false);
                }}
              >
                <X className="h-4 w-4" />
                Fermer
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Titre</span>
                <input
                  className="input w-full"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  className="input min-h-28 w-full"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Contexte, lien concurrent, pourquoi c’est utile…"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Statut</span>
                  <select
                    className="input w-full"
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  >
                    {STATUS_COLUMNS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Horizon</span>
                  <select
                    className="input w-full"
                    value={draft.horizon}
                    onChange={(e) => setDraft((d) => ({ ...d, horizon: e.target.value }))}
                  >
                    {HORIZON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Priorité</span>
                  <select
                    className="input w-full"
                    value={draft.priority}
                    onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Catégorie</span>
                  <input
                    className="input w-full"
                    value={draft.category}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    placeholder="RH, WMS, IA…"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Lien source</span>
                <input
                  className="input w-full"
                  value={draft.source_url}
                  onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
              {draft.source_url ? (
                <a
                  href={draft.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-1 hover:underline"
                >
                  Ouvrir le lien
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {selected ? (
                <p className="text-xs text-neutral-6">
                  Créé le {formatIsoDate(selected.created_at)}
                  {selected.created_by_email ? ` · ${selected.created_by_email}` : ""}
                </p>
              ) : null}
              {formError ? <p className="text-sm text-danger-1">{formError}</p> : null}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-neutral-4 px-5 py-4 dark:border-neutral-6">
              <button
                type="button"
                className="btn-primary"
                disabled={!draft.title.trim() || createMut.isPending || updateMut.isPending}
                onClick={() => {
                  if (isCreating) {
                    createMut.mutate({
                      title: draft.title.trim(),
                      description: draft.description,
                      status: draft.status,
                      horizon: draft.horizon,
                      priority: draft.priority,
                      category: draft.category,
                      source_url: draft.source_url,
                    });
                    return;
                  }
                  if (selected) {
                    updateMut.mutate({
                      id: selected.id,
                      data: {
                        title: draft.title.trim(),
                        description: draft.description,
                        status: draft.status,
                        horizon: draft.horizon,
                        priority: draft.priority,
                        category: draft.category,
                        source_url: draft.source_url,
                      },
                    });
                  }
                }}
              >
                Enregistrer
              </button>
              {selected ? (
                <button
                  type="button"
                  className="btn-danger"
                  disabled={deleteMut.isPending}
                  onClick={() =>
                    ask({
                      title: "Supprimer cette idée ?",
                      description: `« ${selected.title} » sera retiré du backlog.`,
                      danger: true,
                      confirmText: "Supprimer",
                      action: () => deleteMut.mutate(selected.id),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              ) : null}
            </footer>
          </aside>
        </div>
      ) : null}
      {renderDialog(deleteMut.isPending)}
    </ListPageShell>
  );
}
