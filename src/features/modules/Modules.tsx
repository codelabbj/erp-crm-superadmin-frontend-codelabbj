import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminModuleUpdate } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { clientPageSlice } from "@/lib/pagination";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function Modules() {
  const [filter, setFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState("");
  const debouncedFilter = useDebouncedValue(filter);
  const { page, setPage, pageSize, resetPage } = usePaginationState(25);
  const [feedback, setFeedback] = useState("");
  const { ask, close, renderDialog } = useConfirmDialog();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["modules"],
    queryFn: () => adminApi.modules({ sort: "sort_order" }),
  });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (p: AdminModuleUpdate) => adminApi.updateModule(p),
    onSuccess: async () => {
      setFeedback("Module mis a jour.");
      await qc.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (e) => setFeedback(getErrorMessage(e)),
    onSettled: (_data, _error, variables) => {
      if (variables && typeof variables.is_active === "boolean") close();
    },
  });

  const filteredRows = useMemo(() => {
    const q = debouncedFilter.trim().toLowerCase();
    return (data ?? []).filter((m) => {
      if (activeOnly === "true" && !m.is_active) return false;
      if (activeOnly === "false" && m.is_active) return false;
      if (!q) return true;
      return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    });
  }, [data, debouncedFilter, activeOnly]);

  const { items: rows, total } = useMemo(
    () => clientPageSlice(filteredRows, page, pageSize),
    [filteredRows, page, pageSize],
  );

  return (
    <ListPageShell>
      <PageHeader title="Modules" description="Catalogue licensing — prix, essai et activation." />
      <FilterBar>
        <SearchInput
          value={filter}
          onChange={(v) => {
            setFilter(v);
            resetPage();
          }}
          placeholder="Code ou nom…"
        />
        <FilterSelect
          value={activeOnly}
          onChange={(v) => {
            setActiveOnly(v);
            resetPage();
          }}
          placeholder="Tous"
          options={[
            { value: "true", label: "Actifs" },
            { value: "false", label: "Inactifs" },
          ]}
        />
      </FilterBar>
      {feedback ? <p className="text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Ordre</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Code</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Nom</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Description</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Mensuel</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Annuel</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Essai (j)</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="max-w-[72px]">
                  <input
                    className="max-w-[72px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="number"
                    aria-label={`Ordre du module ${m.code}`}
                    defaultValue={m.sort_order}
                    onBlur={(e) => mut.mutate({ id: m.id, sort_order: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{m.code}</code>
                </td>
                <td>
                  <input
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label={`Nom du module ${m.code}`}
                    defaultValue={m.name}
                    onBlur={(e) => mut.mutate({ id: m.id, name: e.target.value })}
                  />
                </td>
                <td className="min-w-[200px]">
                  <textarea
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    rows={2}
                    aria-label={`Description du module ${m.code}`}
                    defaultValue={m.description}
                    onBlur={(e) => mut.mutate({ id: m.id, description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label={`Prix mensuel du module ${m.code}`}
                    defaultValue={m.price_monthly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_monthly: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    aria-label={`Prix annuel du module ${m.code}`}
                    defaultValue={m.price_yearly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_yearly: e.target.value })}
                  />
                </td>
                <td className="max-w-[80px]">
                  <input
                    className="max-w-[80px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="number"
                    aria-label={`Jours d'essai du module ${m.code}`}
                    defaultValue={m.trial_days}
                    onBlur={(e) => mut.mutate({ id: m.id, trial_days: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() =>
                      ask({
                        description: m.is_active
                          ? `Désactiver le module « ${m.name} » ?`
                          : `Activer le module « ${m.name} » ?`,
                        danger: m.is_active,
                        confirmText: m.is_active ? "Désactiver" : "Activer",
                        action: () => mut.mutate({ id: m.id, is_active: !m.is_active }),
                      })
                    }
                  >
                    {m.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      {renderDialog(mut.isPending)}
    </ListPageShell>
  );
}
