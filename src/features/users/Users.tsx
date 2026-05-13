import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

export function Users() {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    message: string;
    payload: { id: string; is_active?: boolean; is_staff?: boolean; is_superuser?: boolean };
  } | null>(null);
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

  const confirmAndMutate = (message: string, payload: { id: string; is_active?: boolean; is_staff?: boolean; is_superuser?: boolean }) => {
    setPendingAction({ message, payload });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    mut.mutate(pendingAction.payload, {
      onSettled: () => setPendingAction(null),
    });
  };

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Utilisateurs</h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Recherche
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Email, nom..."
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
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Email</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Nom</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Roles</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Cree</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actif</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actions user</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((u) => (
              <tr key={u.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{u.email}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{u.full_name}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{u.org?.name ?? "—"}</td>
                <td className="px-2 py-2">
                  {u.is_superuser ? (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold lowercase text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      superuser
                    </span>
                  ) : u.is_staff ? (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold lowercase text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      staff
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted dark:text-slate-400">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(u.created_at)}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      u.is_active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {u.is_active ? "Oui" : "Non"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        confirmAndMutate(
                          u.is_active ? "Confirmer la desactivation de cet utilisateur ?" : "Confirmer l'activation de cet utilisateur ?",
                          { id: u.id, is_active: !u.is_active },
                        )
                      }
                    >
                      {u.is_active ? "Desactiver" : "Activer"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        confirmAndMutate(
                          u.is_staff ? "Confirmer le retrait du role staff ?" : "Confirmer l'attribution du role staff ?",
                          { id: u.id, is_staff: !u.is_staff },
                        )
                      }
                    >
                      {u.is_staff ? "Retirer staff" : "Rendre staff"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        confirmAndMutate(
                          u.is_superuser
                            ? "Confirmer le retrait du role superuser ?"
                            : "Confirmer l'attribution du role superuser ?",
                          { id: u.id, is_superuser: !u.is_superuser },
                        )
                      }
                    >
                      {u.is_superuser ? "Retirer superuser" : "Rendre superuser"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOffset((v) => Math.max(0, v - limit))}
          disabled={offset === 0}
        >
          Precedent
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOffset((v) => v + limit)}
          disabled={(data?.results?.length ?? 0) < limit}
        >
          Suivant
        </button>
      </div>
      {pendingAction ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-gray-900/55 p-4">
          <div className="grid w-[min(92vw,420px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Confirmer l'action</h4>
            <p className="m-0 text-sm text-gray-700 dark:text-slate-300">{pendingAction.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingAction(null)}
                disabled={mut.isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-magenta"
                onClick={handleConfirmAction}
                disabled={mut.isPending}
              >
                {mut.isPending ? "Application..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
