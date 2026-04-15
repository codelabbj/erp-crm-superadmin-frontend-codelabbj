import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

export function Users() {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [feedback, setFeedback] = useState("");
  const limit = 30;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", q, offset],
    queryFn: () => adminApi.users({ q: q || undefined, limit, offset }),
  });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: async () => {
      setFeedback("Utilisateur mis a jour.");
      await qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => setFeedback(getErrorMessage(e)),
  });

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Utilisateurs</h3>
      <p className="mb-3 text-xs text-text-muted dark:text-slate-400">
        <code>core.User</code> - rattachement a une <code>Organization</code> (org primaire). Drapeaux Django{" "}
        <code>is_staff</code> / <code>is_superuser</code>.
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
            placeholder="Email, nom..."
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
              <th>Email</th>
              <th>Nom</th>
              <th>Organisation</th>
              <th>Roles</th>
              <th>Cree</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.full_name}</td>
                <td>{u.org?.name ?? "—"}</td>
                <td>
                  {u.is_superuser ? (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold lowercase text-red-800">
                      superuser
                    </span>
                  ) : u.is_staff ? (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold lowercase text-amber-800">
                      staff
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted dark:text-slate-400">—</span>
                  )}
                </td>
                <td>{formatIsoDate(u.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:border-brand-magenta-500 hover:text-brand-purple-900"
                    onClick={() => mut.mutate({ id: u.id, is_active: !u.is_active })}
                  >
                    {u.is_active ? "Oui" : "Non"}
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
