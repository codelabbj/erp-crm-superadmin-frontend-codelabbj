import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, XCircle, Loader2 } from "lucide-react";
import {
  adminApi,
  type ExportJobItem,
  type ImportJobItem,
  type PaginatedResponse,
} from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

type DataView = "imports" | "exports";

function normalizeList<T>(data: PaginatedResponse<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function DataOps() {
  const [view, setView] = useState<DataView>("imports");
  const [search, setSearch] = useState("");

  const importsQuery = useQuery({
    queryKey: ["data-imports", search],
    queryFn: () => adminApi.importJobs({ q: search || undefined, limit: 80, offset: 0, sort: "-created_at" }),
  });
  const exportsQuery = useQuery({
    queryKey: ["data-exports", search],
    queryFn: () => adminApi.exportJobs({ q: search || undefined, limit: 80, offset: 0, sort: "-created_at" }),
  });

  const importRows = useMemo(() => normalizeList(importsQuery.data), [importsQuery.data]);
  const exportRows = useMemo(() => normalizeList(exportsQuery.data), [exportsQuery.data]);

  const queryClient = useQueryClient();

  const retryImportMutation = useMutation({
    mutationFn: (id: string) => adminApi.retryImport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-imports"] }),
  });

  const cancelImportMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelImport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-imports"] }),
  });

  const retryExportMutation = useMutation({
    mutationFn: (id: string) => adminApi.retryExport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-exports"] }),
  });

  const cancelExportMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelExport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-exports"] }),
  });

  const loading = (view === "imports" && importsQuery.isLoading) || (view === "exports" && exportsQuery.isLoading);
  const error = (view === "imports" && importsQuery.error) || (view === "exports" && exportsQuery.error);

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Data Ops</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pilotage des jobs d&apos;import/export via <code>/api/io/imports</code> et <code>/api/io/exports</code>.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
          <button
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "imports" ? "bg-brand-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setView("imports")}
          >
            Imports
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "exports" ? "bg-brand-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setView("exports")}
          >
            Exports
          </button>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Recherche</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="module, statut, fichier..." className="w-72" />
        </label>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chargement...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{getErrorMessage(error)}</p> : null}

      {!loading && !error && view === "imports" ? (
        <div className="mt-4 max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Module</th>
                <th>Fichier</th>
                <th>Statut</th>
                <th>Cree le</th>
                <th>Termine le</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {importRows.map((job: ImportJobItem) => (
                <tr key={job.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{job.module_code}</td>
                  <td>{job.file_name || job.file_path || "—"}</td>
                  <td>{job.status || "—"}</td>
                  <td>{formatDate(job.created_at)}</td>
                  <td>{formatDate(job.completed_at)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {job.status === "failed" && (
                        <button
                          onClick={() => retryImportMutation.mutate(job.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          title="Relancer"
                        >
                          {retryImportMutation.isPending && retryImportMutation.variables === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                      )}
                      {(job.status === "pending" || job.status === "running") && (
                        <button
                          onClick={() => cancelImportMutation.mutate(job.id)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Annuler"
                        >
                          {cancelImportMutation.isPending && cancelImportMutation.variables === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && view === "exports" ? (
        <div className="mt-4 max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Module</th>
                <th>Format</th>
                <th>Statut</th>
                <th>Fichier</th>
                <th>Cree le</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((job: ExportJobItem) => (
                <tr key={job.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{job.module_code}</td>
                  <td>{job.format || "—"}</td>
                  <td>{job.status || "—"}</td>
                  <td>{job.file_path || "—"}</td>
                  <td>{formatDate(job.created_at)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {job.status === "failed" && (
                        <button
                          onClick={() => retryExportMutation.mutate(job.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          title="Relancer"
                        >
                          {retryExportMutation.isPending && retryExportMutation.variables === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </button>
                      )}
                      {(job.status === "pending" || job.status === "running") && (
                        <button
                          onClick={() => cancelExportMutation.mutate(job.id)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Annuler"
                        >
                          {cancelExportMutation.isPending && cancelExportMutation.variables === job.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
