import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AuditLogItem } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: adminApi.auditLogs,
  });

  const actions = useMemo(() => {
    const values = new Set((data ?? []).map((l) => l.action).filter(Boolean));
    return Array.from(values).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (actionFilter && row.action !== actionFilter) return false;
      if (!q) return true;
      return (
        row.action.toLowerCase().includes(q) ||
        row.entity_type.toLowerCase().includes(q) ||
        String(row.entity_id).toLowerCase().includes(q) ||
        String(row.user_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [actionFilter, data, search]);

  const pageRows = filtered.slice(offset, offset + limit);

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Audit Logs</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Historique des actions sensibles remontees par l&apos;API globale.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Recherche</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="action, entite, user..."
            className="w-64"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Action</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setOffset(0);
            }}
            className="w-52"
          >
            <option value="">Toutes</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mt-4 text-sm text-red-600">{getErrorMessage(error)}</p> : null}

      {!isLoading && !isError ? (
        <>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table>
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th>Date</th>
                  <th>Action</th>
                  <th>Entite</th>
                  <th>ID Entite</th>
                  <th>Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row: AuditLogItem) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.created_at)}</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{row.action}</td>
                    <td>{row.entity_type}</td>
                    <td>
                      <code>{row.entity_id}</code>
                    </td>
                    <td>{row.user_email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Total: {filtered.length}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => setOffset((v) => Math.max(0, v - limit))}
                disabled={offset === 0}
              >
                Precedent
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => setOffset((v) => v + limit)}
                disabled={offset + limit >= filtered.length}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
