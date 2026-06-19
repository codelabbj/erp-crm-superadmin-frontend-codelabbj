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
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";

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
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(25);

  const importsQuery = useQuery({
    queryKey: ["data-imports", debouncedSearch, page],
    queryFn: () =>
      adminApi.importJobs({
        q: debouncedSearch || undefined,
        limit: pageSize,
        offset,
        sort: "-created_at",
      }),
    enabled: view === "imports",
  });
  const exportsQuery = useQuery({
    queryKey: ["data-exports", debouncedSearch, page],
    queryFn: () =>
      adminApi.exportJobs({
        q: debouncedSearch || undefined,
        limit: pageSize,
        offset,
        sort: "-created_at",
      }),
    enabled: view === "exports",
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

  const activeData = view === "imports" ? importsQuery.data : exportsQuery.data;
  const total = paginatedCount(activeData as Parameters<typeof paginatedCount>[0]);

  return (
    <ListPageShell>
      <PageHeader
        title="Jobs import / export"
        description="Pilotage des tâches IO (imports et exports)."
      />
      <FilterBar>
        <div className="inline-flex rounded-xl border border-neutral-4 p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === "imports" ? "bg-neutral-0 shadow-sm" : "text-neutral-6"}`}
            onClick={() => {
              setView("imports");
              resetPage();
            }}
          >
            Imports
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === "exports" ? "bg-neutral-0 shadow-sm" : "text-neutral-6"}`}
            onClick={() => {
              setView("exports");
              resetPage();
            }}
          >
            Exports
          </button>
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Module, statut, fichier…"
        />
      </FilterBar>

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
                          className="btn-ghost h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
                          className="btn-ghost h-8 w-8 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
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
                          className="btn-ghost h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
                          className="btn-ghost h-8 w-8 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
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
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </ListPageShell>
  );
}
