import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Loader2, Upload } from "lucide-react";
import { adminApi, type BusinessInvoiceItem } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function proofHref(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

type Props = {
  invoice: BusinessInvoiceItem;
  onClose: () => void;
  onConfirmed: () => void;
};

export function ConfirmBankPaymentModal({ invoice, onClose, onConfirmed }: Props) {
  const customerProof = invoice.bank_transfer?.proof_url;
  const customerRef = invoice.bank_transfer?.bank_reference || "";
  const hasCustomerProof =
    invoice.bank_transfer?.review_status === "pending_review" && Boolean(customerProof);

  const [proof, setProof] = useState<File | null>(null);
  const [bankReference, setBankReference] = useState(customerRef);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      if (!proof && !hasCustomerProof) {
        throw new Error("Preuve de paiement requise.");
      }
      return adminApi.confirmBusinessInvoiceBankPayment(invoice.id, {
        proof: proof ?? undefined,
        bank_reference: bankReference,
        admin_notes: adminNotes,
      });
    },
    onSuccess: () => onConfirmed(),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const proofLink = proofHref(customerProof);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold">Valider virement bancaire</h2>
        <p className="mb-4 text-sm text-slate-500">
          Facture {invoice.invoice_number} — {invoice.amount_total} {invoice.currency || "XOF"}
        </p>
        {hasCustomerProof ? (
          <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/40">
            <p className="mb-1 font-medium text-violet-900 dark:text-violet-200">
              Reçu soumis par le client
            </p>
            {customerRef ? (
              <p className="mb-2 text-xs text-slate-600">Réf. client : {customerRef}</p>
            ) : null}
            {invoice.bank_transfer?.customer_note ? (
              <p className="mb-2 text-xs text-slate-600">
                Note : {invoice.bank_transfer.customer_note}
              </p>
            ) : null}
            <a
              href={proofLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 underline"
            >
              <ExternalLink size={12} /> Voir le reçu
            </a>
          </div>
        ) : null}
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="text-sm">
            {hasCustomerProof
              ? "Remplacer la preuve client (optionnel)"
              : "Preuve de paiement (PDF, JPEG, PNG) *"}
            <input
              type="file"
              className="input mt-1 w-full text-xs"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required={!hasCustomerProof}
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-sm">
            Référence bancaire / libellé virement
            <input
              className="input mt-1 w-full"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              placeholder={invoice.invoice_number}
            />
          </label>
          <label className="text-sm">
            Notes internes
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={(!proof && !hasCustomerProof) || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1 inline animate-spin" size={14} /> Validation…
                </>
              ) : (
                <>
                  <Upload size={14} className="mr-1 inline" /> Valider et activer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
