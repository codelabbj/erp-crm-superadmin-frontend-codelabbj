import { useQuery } from "@tanstack/react-query";
import { adminApi, type AuditLogItem } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useState } from "react";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

const ACTION_OPTIONS = [
  { value: "create", label: "create" },
  { value: "update", label: "update" },
  { value: "delete", label: "delete" },
  { value: "login", label: "login" },
  { value: "logout", label: "logout" },
];

export function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [sort, setSort] = useState("-created_at");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(25);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit-logs", debouncedSearch, actionFilter, sort, page],
    queryFn: () =>
      adminApi.auditLogs({
        q: debouncedSearch || undefined,
        action: actionFilter || undefined,
        limit: pageSize,
        offset,
        sort,
      }),
  });

  const total = paginatedCount(data);
  const rows = (data?.results ?? []) as AuditLogItem[];

  return (
    <ListPageShell>
      <PageHeader
        title="Journaux d'audit"
        description="Historique des actions sensibles (filtrage et pagination côté serveur)."
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Action, entité, utilisateur…"
        />
        <FilterSelect
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v);
            resetPage();
          }}
          placeholder="Toutes les actions"
          options={ACTION_OPTIONS}
          className="min-w-[160px]"
        />
        <FilterSelect
          value={sort}
          onChange={(v) => {
            setSort(v);
            resetPage();
          }}
          options={[
            { value: "-created_at", label: "Plus récent" },
            { value: "created_at", label: "Plus ancien" },
            { value: "action", label: "Action A→Z" },
          ]}
          className="min-w-[140px]"
        />
      </FilterBar>

      {isLoading ? <p className="text-sm text-neutral-6">Chargement…</p> : null}
      {isError ? <p className="text-sm text-danger-1">{getErrorMessage(error)}</p> : null}

      {!isLoading && !isError ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-xl ring-1 ring-neutral-4">
            <table>
              <thead>
                <tr className="bg-neutral-1 text-xs uppercase tracking-wide text-neutral-6">
                  <th>Date</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>ID</th>
                  <th>Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-neutral-6">
                      Aucun événement pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.created_at)}</td>
                      <td className="font-medium text-neutral-9">{row.action}</td>
                      <td>{row.entity_type}</td>
                      <td>
                        <code>{row.entity_id}</code>
                      </td>
                      <td>{row.user_email || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      ) : null}
    </ListPageShell>
  );
}
