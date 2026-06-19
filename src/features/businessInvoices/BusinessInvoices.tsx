import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Plus, XCircle } from "lucide-react";
import { adminApi, type BusinessInvoiceItem } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { paginatedCount } from "@/lib/pagination";
import { formatMoneyFromApi } from "@/lib/money";

const STATUS_OPTIONS = [
  { value: "", label: "Tous statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "pending_payment", label: "Paiement en cours" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
  { value: "expired", label: "Expirée" },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-800",
    pending_payment: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
    expired: "bg-rose-100 text-rose-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export function BusinessInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, offset, pageSize, resetPage } = usePaginationState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const qc = useQueryClient();

  const orgsQuery = useQuery({
    queryKey: ["admin-orgs-picker"],
    queryFn: () => adminApi.organizations({ limit: 200, sort: "-created_at" }),
  });

  const invoicesQuery = useQuery({
    queryKey: ["business-invoices", statusFilter, page],
    queryFn: () =>
      adminApi.businessInvoices({
        status: statusFilter || undefined,
        limit: pageSize,
        offset,
      }),
  });

  const invoices = invoicesQuery.data?.results ?? [];
  const total = paginatedCount(invoicesQuery.data);

  const sendMutation = useMutation({
    mutationFn: (id: string) => adminApi.sendBusinessInvoice(id),
    onSuccess: () => {
      setFeedback("Facture envoyée par e-mail.");
      qc.invalidateQueries({ queryKey: ["business-invoices"] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelBusinessInvoice(id),
    onSuccess: () => {
      setFeedback("Facture annulée.");
      qc.invalidateQueries({ queryKey: ["business-invoices"] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
  });

  const orgOptions = useMemo(
    () => (orgsQuery.data?.results ?? []).map((o) => ({ id: o.id, name: o.name })),
    [orgsQuery.data],
  );

  return (
    <ListPageShell>
      <PageHeader
        title="Factures Business"
        description="Devis commercial → facture par e-mail → paiement PAL → activation automatique."
        actions={
          <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouvelle facture
          </button>
        }
      />

      {feedback && (
        <p className="mb-3 text-sm text-slate-600" role="status">
          {feedback}
        </p>
      )}

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Rechercher org…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Statut"
        />
      </FilterBar>

      {invoicesQuery.isLoading ? (
        <p className="flex items-center gap-2 text-slate-500">
          <Loader2 className="animate-spin" size={18} /> Chargement…
        </p>
      ) : invoicesQuery.isError ? (
        <p className="text-red-600">{getErrorMessage(invoicesQuery.error)}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">N°</th>
                  <th className="px-3 py-2">Organisation</th>
                  <th className="px-3 py-2">Hébergement</th>
                  <th className="px-3 py-2">Montant</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Envoyée</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((inv) =>
                    debouncedSearch
                      ? inv.org_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                        inv.invoice_number.toLowerCase().includes(debouncedSearch.toLowerCase())
                      : true,
                  )
                  .map((inv: BusinessInvoiceItem) => (
                    <tr key={inv.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-3 py-2">{inv.org_name}</td>
                      <td className="px-3 py-2">
                        {inv.deployment_type === "dedicated" ? "Dédié" : "Plateforme"}
                      </td>
                      <td className="px-3 py-2">{formatMoneyFromApi(inv.amount_total)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(inv.status)}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatIsoDate(inv.sent_at ?? undefined)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn-secondary px-2 py-1 text-xs"
                              disabled={sendMutation.isPending}
                              onClick={() => sendMutation.mutate(inv.id)}
                            >
                              <Mail size={12} /> Envoyer
                            </button>
                          )}
                          {inv.payment_url && inv.status !== "paid" && (
                            <a
                              href={inv.payment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Lien PAL
                            </a>
                          )}
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn-secondary px-2 py-1 text-xs text-red-700"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(inv.id)}
                            >
                              <XCircle size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!invoices.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      Aucune facture Business.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </>
      )}

      {showCreate && (
        <CreateBusinessInvoiceModal
          orgOptions={orgOptions}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setFeedback("Facture créée.");
            qc.invalidateQueries({ queryKey: ["business-invoices"] });
          }}
          onError={(msg) => setFeedback(msg)}
        />
      )}
    </ListPageShell>
  );
}

type CreateModalProps = {
  orgOptions: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
};

function CreateBusinessInvoiceModal({
  orgOptions,
  onClose,
  onCreated,
  onError,
}: CreateModalProps) {
  const [orgId, setOrgId] = useState(orgOptions[0]?.id ?? "");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [deploymentType, setDeploymentType] = useState<"platform" | "dedicated">("platform");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [includedSeats, setIncludedSeats] = useState(25);
  const [amountTotal, setAmountTotal] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createBusinessInvoice({
        org_id: orgId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        deployment_type: deploymentType,
        billing_cycle: billingCycle,
        included_seats: includedSeats,
        amount_total: amountTotal,
        send_email: sendEmail,
        notes,
      }),
    onSuccess: onCreated,
    onError: (err) => onError(getErrorMessage(err)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Nouvelle facture Business</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <label className="text-sm">
            Organisation
            <select
              className="input mt-1 w-full"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
            >
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            E-mail destinataire
            <input
              type="email"
              className="input mt-1 w-full"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Nom destinataire (optionnel)
            <input
              className="input mt-1 w-full"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Hébergement
              <select
                className="input mt-1 w-full"
                value={deploymentType}
                onChange={(e) =>
                  setDeploymentType(e.target.value as "platform" | "dedicated")
                }
              >
                <option value="platform">Plateforme OwoDesk</option>
                <option value="dedicated">Serveur dédié</option>
              </select>
            </label>
            <label className="text-sm">
              Cycle
              <select
                className="input mt-1 w-full"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")}
              >
                <option value="yearly">Annuel</option>
                <option value="monthly">Mensuel</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Sièges inclus
              <input
                type="number"
                min={1}
                className="input mt-1 w-full"
                value={includedSeats}
                onChange={(e) => setIncludedSeats(Number(e.target.value))}
              />
            </label>
            <label className="text-sm">
              Montant total (XOF)
              <input
                type="number"
                min={1}
                className="input mt-1 w-full"
                value={amountTotal}
                onChange={(e) => setAmountTotal(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="text-sm">
            Notes internes
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Envoyer la facture par e-mail immédiatement
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création…" : "Créer la facture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
