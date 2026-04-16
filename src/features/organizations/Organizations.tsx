import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

export function Organizations() {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [feedback, setFeedback] = useState("");
  const limit = 30;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orgs", q, offset],
    queryFn: () => adminApi.organizations({ q: q || undefined, limit, offset }),
  });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: adminApi.updateOrganization,
    onSuccess: async () => {
      setFeedback("Organisation mise a jour.");
      await qc.invalidateQueries({ queryKey: ["orgs"] });
    },
    onError: (e) => setFeedback(getErrorMessage(e)),
  });

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Organisations</h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Recherche
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Nom, slug..."
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
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Nom</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Slug</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Pays</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Devise</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Membres</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Creee</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((o) => (
              <tr key={o.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{o.name}</td>
                <td className="px-2 py-2">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{o.slug}</code>
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{o.country}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{o.currency}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{o.members_count}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(o.created_at)}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                    onClick={() => mut.mutate({ id: o.id, is_active: !o.is_active })}
                  >
                    {o.is_active ? "Oui" : "Non"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          onClick={() => setOffset((v) => Math.max(0, v - limit))}
          disabled={offset === 0}
        >
          Precedent
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          onClick={() => setOffset((v) => v + limit)}
          disabled={(data?.results?.length ?? 0) < limit}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
