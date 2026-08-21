import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Plus, Upload, XCircle } from "lucide-react";
import { adminApi, type BusinessInvoiceItem } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { formatMoneyFromApi } from "@/lib/money";
import { CreateBusinessInvoiceModal } from "@/features/businessInvoices/CreateBusinessInvoiceModal";
import { ConfirmBankPaymentModal } from "@/features/businessInvoices/ConfirmBankPaymentModal";
import { RejectBankPaymentModal } from "@/features/businessInvoices/RejectBankPaymentModal";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  pending_payment: "PAL en cours",
  pending_bank_transfer: "Virement en attente",
  paid: "Payée",
  cancelled: "Annulée",
  expired: "Expirée",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    sent: "bg-blue-100 text-blue-800",
    pending_payment: "bg-amber-100 text-amber-800",
    pending_bank_transfer: "bg-violet-100 text-violet-800",
    paid: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
    expired: "bg-rose-100 text-rose-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

type Props = {
  orgId: string;
  orgName: string;
  defaultRecipientEmail?: string;
};

export function OrgBusinessInvoicesPanel({ orgId, orgName, defaultRecipientEmail }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [confirmInvoice, setConfirmInvoice] = useState<BusinessInvoiceItem | null>(null);
  const [rejectInvoice, setRejectInvoice] = useState<BusinessInvoiceItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const qc = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();

  const invoicesQuery = useQuery({
    queryKey: ["business-invoices", orgId],
    queryFn: () => adminApi.businessInvoices({ org_id: orgId, limit: 50 }),
  });

  const invoices = invoicesQuery.data?.results ?? [];

  const sendMutation = useMutation({
    mutationFn: (id: string) => adminApi.sendBusinessInvoice(id),
    onSuccess: () => {
      setFeedback("Facture envoyée par e-mail.");
      qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => close(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelBusinessInvoice(id),
    onSuccess: () => {
      setFeedback("Facture annulée.");
      qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => close(),
  });

  return (
    <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="m-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Factures Business
          </h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            PAL en ligne ou virement bancaire (confirmation manuelle avec preuve)
          </p>
        </div>
        <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => setShowCreate(true)}>
          <Plus size={14} className="mr-1 inline" /> Émettre une facture
        </button>
      </div>

      {feedback ? (
        <p className="mx-5 mt-3 text-xs text-slate-600" role="status">
          {feedback}
        </p>
      ) : null}

      {invoicesQuery.isLoading ? (
        <p className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={16} /> Chargement…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-2 text-left">N°</th>
                <th className="px-5 py-2 text-left">Hébergement</th>
                <th className="px-5 py-2 text-left">Montant</th>
                <th className="px-5 py-2 text-left">Statut</th>
                <th className="px-5 py-2 text-left">Envoyée</th>
                <th className="px-5 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv: BusinessInvoiceItem) => (
                <tr key={inv.id}>
                  <td className="px-5 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-xs">
                    {inv.deployment_type === "dedicated" ? "Serveur dédié" : "Plateforme"}
                  </td>
                  <td className="px-5 py-3">{formatMoneyFromApi(inv.amount_total)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(inv.status)}`}
                    >
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                    {inv.status === "pending_bank_transfer" &&
                    inv.bank_transfer?.review_status === "pending_review" ? (
                      <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        Reçu à valider
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {formatIsoDate(inv.sent_at ?? undefined)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {inv.status !== "paid" && inv.status !== "cancelled" ? (
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-[10px]"
                          disabled={sendMutation.isPending}
                          onClick={() =>
                            ask({
                              description: `Envoyer la facture ${inv.invoice_number} par e-mail ?`,
                              confirmText: "Envoyer",
                              action: () => sendMutation.mutate(inv.id),
                            })
                          }
                        >
                          <Mail size={11} /> Envoyer
                        </button>
                      ) : null}
                      {inv.payment_url && inv.status !== "paid" ? (
                        <a
                          href={inv.payment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary px-2 py-1 text-[10px]"
                        >
                          Lien PAL
                        </a>
                      ) : null}
                      {inv.status === "pending_bank_transfer" &&
                      inv.bank_transfer?.review_status === "pending_review" ? (
                        <>
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[10px] text-emerald-800"
                            onClick={() => setConfirmInvoice(inv)}
                          >
                            <Upload size={11} /> Valider
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[10px] text-red-700"
                            onClick={() => setRejectInvoice(inv)}
                          >
                            <XCircle size={11} /> Rejeter
                          </button>
                        </>
                      ) : ["sent", "pending_payment"].includes(inv.status) ? (
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-[10px] text-emerald-800"
                          onClick={() => setConfirmInvoice(inv)}
                        >
                          <Upload size={11} /> Confirmer virement
                        </button>
                      ) : null}
                      {inv.status !== "paid" && inv.status !== "cancelled" ? (
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-[10px] text-red-700"
                          disabled={cancelMutation.isPending}
                          onClick={() =>
                            ask({
                              description: `Annuler la facture ${inv.invoice_number} ? Cette action est irréversible.`,
                              danger: true,
                              confirmText: "Annuler la facture",
                              action: () => cancelMutation.mutate(inv.id),
                            })
                          }
                        >
                          <XCircle size={11} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!invoices.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                    Aucune facture Business pour cette organisation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {confirmInvoice ? (
        <ConfirmBankPaymentModal
          invoice={confirmInvoice}
          onClose={() => setConfirmInvoice(null)}
          onConfirmed={() => {
            setConfirmInvoice(null);
            setFeedback("Virement validé — forfait activé.");
            qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
          }}
        />
      ) : null}

      {rejectInvoice ? (
        <RejectBankPaymentModal
          invoice={rejectInvoice}
          onClose={() => setRejectInvoice(null)}
          onRejected={() => {
            setRejectInvoice(null);
            setFeedback("Virement rejeté — le client peut soumettre une nouvelle preuve.");
            qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
          }}
        />
      ) : null}

      {showCreate ? (
        <CreateBusinessInvoiceModal
          orgId={orgId}
          orgName={orgName}
          defaultRecipientEmail={defaultRecipientEmail}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setFeedback("Facture créée.");
            qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
          }}
          onError={(msg) => setFeedback(msg)}
        />
      ) : null}

      {renderDialog(sendMutation.isPending || cancelMutation.isPending)}
    </section>
  );
}
