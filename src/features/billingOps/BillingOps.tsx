import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, FileCheck, Loader2 } from "lucide-react";
import {
  adminApi,
  type BillingClientItem,
  type BillingInvoiceItem,
  type BillingPaymentItem,
  type PaginatedResponse,
} from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";

type BillingView = "clients" | "invoices" | "payments";

function normalizeList<T>(data: PaginatedResponse<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function BillingOps() {
  const [view, setView] = useState<BillingView>("clients");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(25);

  const clientsQuery = useQuery({
    queryKey: ["billing-clients", debouncedSearch, page],
    queryFn: () =>
      adminApi.billingClients({
        q: debouncedSearch || undefined,
        limit: pageSize,
        offset,
        sort: "-id",
      }),
    enabled: view === "clients",
  });
  const invoicesQuery = useQuery({
    queryKey: ["billing-invoices", debouncedSearch, page],
    queryFn: () =>
      adminApi.billingInvoices({
        q: debouncedSearch || undefined,
        limit: pageSize,
        offset,
        sort: "-issued_at",
      }),
    enabled: view === "invoices",
  });
  const paymentsQuery = useQuery({
    queryKey: ["billing-payments", debouncedSearch, page],
    queryFn: () =>
      adminApi.billingPayments({
        q: debouncedSearch || undefined,
        limit: pageSize,
        offset,
        sort: "-created_at",
      }),
    enabled: view === "payments",
  });

  const clients = useMemo(() => normalizeList(clientsQuery.data), [clientsQuery.data]);
  const invoices = useMemo(() => normalizeList(invoicesQuery.data), [invoicesQuery.data]);
  const payments = useMemo(() => normalizeList(paymentsQuery.data), [paymentsQuery.data]);

  const queryClient = useQueryClient();

  const finalizeMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => adminApi.finalizeInvoice(id, { invoice_type: type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-invoices"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-invoices"] }),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (id: string) => adminApi.confirmPayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-payments"] }),
  });

  const loading =
    (view === "clients" && clientsQuery.isLoading) ||
    (view === "invoices" && invoicesQuery.isLoading) ||
    (view === "payments" && paymentsQuery.isLoading);

  const error =
    (view === "clients" && clientsQuery.error) ||
    (view === "invoices" && invoicesQuery.error) ||
    (view === "payments" && paymentsQuery.error);

  const activeData =
    view === "clients" ? clientsQuery.data : view === "invoices" ? invoicesQuery.data : paymentsQuery.data;
  const total = paginatedCount(activeData as Parameters<typeof paginatedCount>[0]);

  return (
    <ListPageShell>
      <PageHeader title="Facturation" description="Clients, factures et paiements." />
      <FilterBar>
        <div className="inline-flex rounded-xl border border-neutral-4 p-1">
          {(["clients", "invoices", "payments"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                view === tab ? "bg-neutral-0 text-neutral-9 shadow-sm" : "text-neutral-6"
              }`}
              onClick={() => {
                setView(tab);
                resetPage();
              }}
            >
              {tab === "clients" ? "Clients" : tab === "invoices" ? "Factures" : "Paiements"}
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Nom, facture, statut…"
        />
      </FilterBar>

      {loading ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chargement...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{getErrorMessage(error)}</p> : null}

      {!loading && !error && view === "clients" ? (
        <div className="mt-4 max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Nom</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax ID</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: BillingClientItem) => (
                <tr key={c.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.tax_id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && view === "invoices" ? (
        <div className="mt-4 max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Invoice</th>
                <th>Client</th>
                <th>Status</th>
                <th>Type</th>
                 <th>Total</th>
                <th>Issued</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: BillingInvoiceItem) => (
                <tr key={inv.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{inv.invoice_number}</td>
                  <td>{typeof inv.client === "string" ? inv.client : inv.client?.name || "—"}</td>
                  <td>{inv.status || "—"}</td>
                  <td>{inv.invoice_type || "—"}</td>
                  <td>{inv.total || "—"}</td>
                  <td>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {inv.status === "draft" && (
                        <button
                          onClick={() => finalizeMutation.mutate({ id: inv.id, type: "simple" })}
                          className="btn-ghost h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                          title="Finaliser"
                        >
                          {finalizeMutation.isPending && finalizeMutation.variables?.id === inv.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <FileCheck size={16} />
                          )}
                        </button>
                      )}
                      {inv.status !== "cancelled" && (
                        <button
                          onClick={() => cancelMutation.mutate(inv.id)}
                          className="btn-ghost h-8 w-8 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
                          title="Annuler"
                        >
                          {cancelMutation.isPending && cancelMutation.variables === inv.id ? (
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

      {!loading && !error && view === "payments" ? (
        <div className="mt-4 max-w-full overflow-x-auto">
          <table>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th>Amount</th>
                <th>Flow</th>
                <th>Method</th>
                <th>Status</th>
                 <th>Invoice</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: BillingPaymentItem) => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{p.amount || "—"}</td>
                  <td>{p.flow || "—"}</td>
                  <td>{p.method || "—"}</td>
                  <td>{p.status || "—"}</td>
                  <td>{p.invoice_detail || "—"}</td>
                  <td>{p.paid_at || p.created_at ? new Date((p.paid_at || p.created_at) as string).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="text-right">
                    {p.status !== "confirmed" && (
                      <button
                        onClick={() => confirmPaymentMutation.mutate(p.id)}
                        className="btn-ghost h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                        title="Confirmer"
                      >
                        {confirmPaymentMutation.isPending && confirmPaymentMutation.variables === p.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                      </button>
                    )}
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
