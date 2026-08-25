import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, RotateCcw, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi, type PdfToolCatalogItem } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { clientPageSlice } from "@/lib/pagination";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { PdfToolsUsagePanel } from "./PdfToolsUsagePanel";

type Filter = "all" | "premium" | "free" | "overridden";
type Tab = "catalog" | "usage";

export function PdfToolsCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "usage" ? "usage" : "catalog";
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "usage") params.set("tab", "usage");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const debouncedSearch = useDebouncedValue(search);
  const pagination = usePaginationState(20);
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();
  const [actionError, setActionError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pdf-tools-catalog"],
    queryFn: () => adminApi.pdfToolsCatalog(),
  });

  const patchMutation = useMutation({
    mutationFn: ({ code, is_premium }: { code: string; is_premium: boolean }) =>
      adminApi.patchPdfToolCatalog(code, { is_premium }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pdf-tools-catalog"] });
      setActionError("");
    },
    onError: (e: unknown) => setActionError(getErrorMessage(e)),
    onSettled: () => close(),
  });

  const resetMutation = useMutation({
    mutationFn: (code: string) => adminApi.resetPdfToolCatalog(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pdf-tools-catalog"] });
      setActionError("");
    },
    onError: (e: unknown) => setActionError(getErrorMessage(e)),
    onSettled: () => close(),
  });

  const tools = data?.tools ?? [];

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return tools.filter((tool) => {
      if (filter === "premium" && !tool.is_premium) return false;
      if (filter === "free" && tool.is_premium) return false;
      if (filter === "overridden" && !tool.is_overridden) return false;
      if (!q) return true;
      return tool.code.toLowerCase().includes(q) || tool.label.toLowerCase().includes(q);
    });
  }, [tools, debouncedSearch, filter]);

  const { items: paged, total } = useMemo(
    () => clientPageSlice(filtered, pagination.page, pagination.pageSize),
    [filtered, pagination.page, pagination.pageSize],
  );

  const toggleTool = (tool: PdfToolCatalogItem) => {
    const nextPremium = !tool.is_premium;
    ask({
      title: nextPremium ? "Rendre Premium" : "Rendre gratuit",
      description: nextPremium
        ? `« ${tool.label} » exigera un abonnement PDF Premium.`
        : `« ${tool.label} » sera accessible sans abonnement Premium.`,
      danger: nextPremium,
      confirmText: nextPremium ? "Rendre Premium" : "Rendre gratuit",
      action: () => patchMutation.mutate({ code: tool.code, is_premium: nextPremium }),
    });
  };

  const resetTool = (tool: PdfToolCatalogItem) => {
    ask({
      title: "Rétablir le défaut",
      description: `Remettre « ${tool.label} » sur ${
        tool.default_is_premium ? "Premium" : "gratuit"
      } (catalogue produit) ?`,
      confirmText: "Rétablir",
      action: () => resetMutation.mutate(tool.code),
    });
  };

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "premium", label: "Premium" },
    { id: "free", label: "Gratuits" },
    { id: "overridden", label: "Surchargés" },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Outils PDF</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catalogue Premium / gratuit, et stats d’utilisation (invités inclus). Les échecs
            serveur exposent le fichier source à télécharger pendant 14 jours.
          </p>
        </div>
        {data && (
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {data.premium_count} Premium
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              {data.free_count} gratuits
            </span>
          </div>
        )}
      </header>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit">
        <button
          onClick={() => setTab("catalog")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === "catalog"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Catalogue
        </button>
        <button
          onClick={() => setTab("usage")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === "usage"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Utilisation
        </button>
      </div>

      {tab === "usage" ? <PdfToolsUsagePanel /> : (
      <>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setFilter(item.id);
              pagination.resetPage();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === item.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            pagination.resetPage();
          }}
          placeholder="Code ou libellé…"
        />
      </FilterBar>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p className="text-center py-12 text-slate-400">Chargement du catalogue…</p>
      ) : paged.length === 0 ? (
        <p className="text-center py-12 text-slate-400">Aucun outil trouvé.</p>
      ) : (
        <div className="grid gap-3">
          {paged.map((tool) => (
            <div
              key={tool.code}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText size={16} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{tool.label}</span>
                  <span className="font-mono text-xs text-slate-400">{tool.code}</span>
                  {tool.is_premium ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      Premium
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Gratuit
                    </span>
                  )}
                  {tool.is_overridden && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Surcharge
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Défaut produit : {tool.default_is_premium ? "Premium" : "gratuit"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {tool.is_overridden && (
                  <button
                    onClick={() => resetTool(tool)}
                    className="btn-ghost h-9 px-3 text-xs text-slate-500 hover:text-slate-800"
                    title="Rétablir le défaut"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={() => toggleTool(tool)}
                  className="text-slate-400 transition hover:text-brand-purple-600 dark:hover:text-brand-magenta-500"
                  title={tool.is_premium ? "Rendre gratuit" : "Rendre Premium"}
                >
                  {tool.is_premium ? (
                    <ToggleRight size={40} className="text-amber-500" />
                  ) : (
                    <ToggleLeft size={40} className="text-emerald-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={total}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
      </>
      )}

      {renderDialog(patchMutation.isPending || resetMutation.isPending)}
    </div>
  );
}
