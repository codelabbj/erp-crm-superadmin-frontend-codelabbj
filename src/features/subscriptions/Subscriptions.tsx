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
      <p className="mb-3 text-xs text-text-muted dark:text-slate-400">
        Modele <code>licensing.Subscription</code> : une ligne par couple (organisation, module), statut et facturation.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Statut
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
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
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Module (code)
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Tous</option>
            {(modules ?? []).map((m) => (
              <option key={m.id} value={m.code}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Module</th>
              <th>Statut</th>
              <th>Cycle</th>
              <th>Debut</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.org.name}</td>
                <td>
                  <span title={s.module.name}>
                    <code>{s.module.code}</code>{" "}
                    {s.module.name ? <span className="text-xs text-text-muted dark:text-slate-400">({s.module.name})</span> : null}
                  </span>
                </td>
                <td>{s.status}</td>
                <td>{s.billing_cycle}</td>
                <td>{formatIsoDate(s.starts_at)}</td>
                <td>{formatIsoDate(s.ends_at)}</td>
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
      <p className="mb-0 text-xs text-text-muted dark:text-slate-400">Total : {data?.count ?? 0} (page {Math.floor(offset / limit) + 1}, limite {limit})</p>
    </div>
  );
}
