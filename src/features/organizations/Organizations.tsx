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
      <p className="mb-3 text-xs text-text-muted dark:text-slate-400">
        <code>core.Organization</code> - comptage des membres via la relation <code>members</code> (UserOrganization).
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Recherche
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Nom, slug..."
          />
        </label>
      </div>
      {feedback ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Pays</th>
              <th>Devise</th>
              <th>Membres</th>
              <th>Creee</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>
                  <code>{o.slug}</code>
                </td>
                <td>{o.country}</td>
                <td>{o.currency}</td>
                <td>{o.members_count}</td>
                <td>{formatIsoDate(o.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:border-brand-magenta-500 hover:text-brand-purple-900"
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
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setOffset((v) => Math.max(0, v - limit))}
          disabled={offset === 0}
        >
          Precedent
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setOffset((v) => v + limit)}
          disabled={(data?.results?.length ?? 0) < limit}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
