import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type PaymentTransactionItem } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { OrgContextBanner } from "@/components/OrgContextBanner";
import { PaymentTransactionDetailModal } from "@/features/paymentTransactions/PaymentTransactionDetailModal";
import { cn } from "@/lib/utils";

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function formatAmount(amount: number | string, currency: string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-FR")} ${currency || "XOF"}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        s === "success" && "bg-success-2 text-success-3",
        s === "failed" && "bg-danger-2 text-danger-1",
        s === "pending" && "bg-warning-2 text-warning-3",
        !["success", "failed", "pending"].includes(s) && "bg-neutral-2 text-neutral-7",
      )}
    >
      {status || "—"}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "pending", label: "pending" },
  { value: "success", label: "success" },
  { value: "failed", label: "failed" },
];

const PURPOSE_OPTIONS = [
  { value: "subscription", label: "subscription" },
  { value: "business_invoice", label: "business_invoice" },
  { value: "payroll", label: "payroll" },
];

const DIRECTION_OPTIONS = [
  { value: "collect", label: "collect" },
  { value: "disburse", label: "disburse" },
];

type PaymentTransactionsListProps = {
  orgId?: string | null;
  embedded?: boolean;
};

export function PaymentTransactionsList({ orgId, embedded = false }: PaymentTransactionsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [selected, setSelected] = useState<PaymentTransactionItem | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(25);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "payment-transactions",
      orgId,
      debouncedSearch,
      statusFilter,
      purposeFilter,
      directionFilter,
      sort,
      page,
    ],
    queryFn: () =>
      orgId
        ? adminApi.organizationPaymentTransactions(orgId, {
            q: debouncedSearch || undefined,
            status: statusFilter || undefined,
            purpose: purposeFilter || undefined,
            direction: directionFilter || undefined,
            limit: pageSize,
            offset,
            sort,
          })
        : adminApi.paymentTransactions({
            q: debouncedSearch || undefined,
            status: statusFilter || undefined,
            purpose: purposeFilter || undefined,
            direction: directionFilter || undefined,
            limit: pageSize,
            offset,
            sort,
          }),
  });

  const total = paginatedCount(data);
  const rows = useMemo(() => (data?.results ?? []) as PaymentTransactionItem[], [data]);

  const shell = (
    <>
      {orgId && !embedded ? <OrgContextBanner orgId={orgId} /> : null}

      {!embedded ? (
        <PageHeader
          title="Transactions PAL"
          description={
            orgId
              ? "Toutes les transactions Mobile Money de cette organisation (microservice pay.owo.bj)."
              : "Journal complet des paiements PAL — collecte et décaissement."
          }
        />
      ) : null}

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Référence, provider, téléphone…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            resetPage();
          }}
          placeholder="Tous statuts"
          options={STATUS_OPTIONS}
          className="min-w-[130px]"
        />
        <FilterSelect
          value={purposeFilter}
          onChange={(v) => {
            setPurposeFilter(v);
            resetPage();
          }}
          placeholder="Tous usages"
          options={PURPOSE_OPTIONS}
          className="min-w-[150px]"
        />
        <FilterSelect
          value={directionFilter}
          onChange={(v) => {
            setDirectionFilter(v);
            resetPage();
          }}
          placeholder="Toutes directions"
          options={DIRECTION_OPTIONS}
          className="min-w-[140px]"
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
            { value: "-amount", label: "Montant ↓" },
            { value: "amount", label: "Montant ↑" },
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
                  {!orgId ? <th>Organisation</th> : null}
                  <th>Référence</th>
                  <th>Provider PAL</th>
                  <th>Usage</th>
                  <th>Direction</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Opérateur</th>
                  <th>Téléphone</th>
                  <th>Callback ERP</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={orgId ? 10 : 11} className="py-8 text-center text-sm text-neutral-6">
                      Aucune transaction pour ces filtres.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.transaction_id || row.external_reference}
                      className="cursor-pointer hover:bg-neutral-1/80"
                      onClick={() => setSelected(row)}
                    >
                      <td className="whitespace-nowrap text-sm">{formatDate(row.created_at)}</td>
                      {!orgId ? (
                        <td className="max-w-[140px] truncate text-sm" title={row.organization_name || row.tenant_id}>
                          {row.organization_name || row.tenant_id?.slice(0, 8) || "—"}
                        </td>
                      ) : null}
                      <td>
                        <code className="text-xs">{row.external_reference}</code>
                      </td>
                      <td>
                        <code className="text-xs">{row.provider_ref || "—"}</code>
                      </td>
                      <td>{row.purpose}</td>
                      <td>{row.direction}</td>
                      <td className="tabular-nums">{formatAmount(row.amount, row.currency)}</td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td>{row.operator || "—"}</td>
                      <td className="whitespace-nowrap text-sm">{row.phone || "—"}</td>
                      <td>{row.callback_dispatched ? "oui" : "non"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      ) : null}

      {selected ? (
        <PaymentTransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );

  if (embedded) return <div className="space-y-4">{shell}</div>;
  return <ListPageShell>{shell}</ListPageShell>;
}
