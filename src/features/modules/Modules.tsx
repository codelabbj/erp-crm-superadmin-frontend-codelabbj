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
      <p className="mb-3 text-xs text-text-muted dark:text-slate-400">
        Champs alignes sur <code>licensing.Module</code> : prix, essai, ordre d&apos;affichage, liaison abonnements via{" "}
        <code>module_id</code>.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Recherche (code/nom)
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="ex: CRM" />
        </label>
      </div>
      {feedback ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Ordre</th>
              <th>Code</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Mensuel</th>
              <th>Annuel</th>
              <th>Essai (j)</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="max-w-[72px]">
                  <input
                    className="max-w-[72px]"
                    type="number"
                    defaultValue={m.sort_order}
                    onBlur={(e) => mut.mutate({ id: m.id, sort_order: Number(e.target.value) || 0 })}
                  />
                </td>
                <td>
                  <code>{m.code}</code>
                </td>
                <td>
                  <input defaultValue={m.name} onBlur={(e) => mut.mutate({ id: m.id, name: e.target.value })} />
                </td>
                <td className="min-w-[200px]">
                  <textarea
                    rows={2}
                    defaultValue={m.description}
                    onBlur={(e) => mut.mutate({ id: m.id, description: e.target.value })}
                  />
                </td>
                <td>
                  <input defaultValue={m.price_monthly} onBlur={(e) => mut.mutate({ id: m.id, price_monthly: e.target.value })} />
                </td>
                <td>
                  <input defaultValue={m.price_yearly} onBlur={(e) => mut.mutate({ id: m.id, price_yearly: e.target.value })} />
                </td>
                <td className="max-w-[80px]">
                  <input
                    type="number"
                    defaultValue={m.trial_days}
                    onBlur={(e) => mut.mutate({ id: m.id, trial_days: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:border-brand-magenta-500 hover:text-brand-purple-900"
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
