import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

export function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const { data: modules } = useQuery({ queryKey: ["modules"], queryFn: () => adminApi.modules({ sort: "sort_order" }) });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subs", statusFilter, moduleFilter, offset],
    queryFn: () =>
      adminApi.subscriptions({
        limit,
        offset,
        sort: "-created_at",
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(moduleFilter ? { module: moduleFilter } : {}),
      }),
  });

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Abonnements (org ↔ module)</h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Statut
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tous</option>
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="expired">expired</option>
            <option value="cancelled">cancelled</option>
            <option value="suspended">suspended</option>
            <option value="past_due">past_due</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Module (code)
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tous</option>
            {(modules ?? []).map((m) => (
              <option key={m.id} value={m.code}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </label>
      </div><br />
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Module</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Statut</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Cycle</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Debut</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Fin</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((s) => (
              <tr key={s.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{s.org.name}</td>
                <td className="px-2 py-2">
                  <span title={s.module.name}>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {s.module.code}
                    </code>{" "}
                    {s.module.name ? <span className="text-xs text-text-muted dark:text-slate-400">({s.module.name})</span> : null}
                  </span>
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{s.status}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{s.billing_cycle}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(s.starts_at)}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(s.ends_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br /><br />
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
          onClick={() => setOffset((v) => Math.max(0, v - limit))}
          disabled={offset === 0}
        >
          Precedent
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
          onClick={() => setOffset((v) => v + limit)}
          disabled={(data?.results?.length ?? 0) < limit}
        >
          Suivant
        </button>
      </div>
      <p className="mb-0 text-xs text-text-muted dark:text-slate-400">Total : {data?.count ?? 0} (page {Math.floor(offset / limit) + 1}, limite {limit})</p>
    </div>
  );
}
