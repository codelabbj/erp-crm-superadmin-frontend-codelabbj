import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminModuleUpdate } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

export function Modules() {
  const [filter, setFilter] = useState("");
  const [feedback, setFeedback] = useState("");
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
  });
  const rows = (data ?? []).filter((m) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Modules (catalogue licensing)</h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Recherche (code/nom)
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ex: CRM"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>
      </div>
      {feedback ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
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
                    defaultValue={m.name}
                    onBlur={(e) => mut.mutate({ id: m.id, name: e.target.value })}
                  />
                </td>
                <td className="min-w-[200px]">
                  <textarea
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    rows={2}
                    defaultValue={m.description}
                    onBlur={(e) => mut.mutate({ id: m.id, description: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    defaultValue={m.price_monthly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_monthly: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    defaultValue={m.price_yearly}
                    onBlur={(e) => mut.mutate({ id: m.id, price_yearly: e.target.value })}
                  />
                </td>
                <td className="max-w-[80px]">
                  <input
                    className="max-w-[80px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    type="number"
                    defaultValue={m.trial_days}
                    onBlur={(e) => mut.mutate({ id: m.id, trial_days: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                    onClick={() => mut.mutate({ id: m.id, is_active: !m.is_active })}
                  >
                    {m.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
