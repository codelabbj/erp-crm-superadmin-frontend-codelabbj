import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  type BillingClientItem,
  type BillingInvoiceItem,
  type BillingPaymentItem,
  type PaginatedResponse,
} from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

type BillingView = "clients" | "invoices" | "payments";

function normalizeList<T>(data: PaginatedResponse<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function BillingOps() {
  const [view, setView] = useState<BillingView>("clients");
  const [search, setSearch] = useState("");

  const clientsQuery = useQuery({
    queryKey: ["billing-clients", search],
    queryFn: () => adminApi.billingClients({ q: search || undefined, limit: 80, offset: 0, sort: "-id" }),
  });
  const invoicesQuery = useQuery({
    queryKey: ["billing-invoices", search],
    queryFn: () => adminApi.billingInvoices({ q: search || undefined, limit: 80, offset: 0, sort: "-issued_at" }),
  });
  const paymentsQuery = useQuery({
    queryKey: ["billing-payments", search],
    queryFn: () => adminApi.billingPayments({ q: search || undefined, limit: 80, offset: 0, sort: "-created_at" }),
  });

  const clients = useMemo(() => normalizeList(clientsQuery.data), [clientsQuery.data]);
  const invoices = useMemo(() => normalizeList(invoicesQuery.data), [invoicesQuery.data]);
  const payments = useMemo(() => normalizeList(paymentsQuery.data), [paymentsQuery.data]);

  const loading =
    (view === "clients" && clientsQuery.isLoading) ||
    (view === "invoices" && invoicesQuery.isLoading) ||
    (view === "payments" && paymentsQuery.isLoading);

  const error =
    (view === "clients" && clientsQuery.error) ||
    (view === "invoices" && invoicesQuery.error) ||
    (view === "payments" && paymentsQuery.error);

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Billing Ops</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
          <button
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "clients" ? "bg-brand-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setView("clients")}
          >
            Clients
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "invoices" ? "bg-brand-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setView("invoices")}
          >
            Invoices
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "payments" ? "bg-brand-purple-700 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setView("payments")}
          >
            Payments
          </button>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Recherche</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="nom, facture, statut..." className="w-72" />
        </label>
      </div>

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
