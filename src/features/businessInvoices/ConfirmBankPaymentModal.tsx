import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { adminApi, type BusinessInvoiceItem } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  invoice: BusinessInvoiceItem;
  onClose: () => void;
  onConfirmed: () => void;
};

export function ConfirmBankPaymentModal({ invoice, onClose, onConfirmed }: Props) {
  const [proof, setProof] = useState<File | null>(null);
  const [bankReference, setBankReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      if (!proof) throw new Error("Preuve de paiement requise.");
      return adminApi.confirmBusinessInvoiceBankPayment(invoice.id, {
        proof,
        bank_reference: bankReference,
        admin_notes: adminNotes,
      });
    },
    onSuccess: () => onConfirmed(),
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold">Confirmer virement bancaire</h2>
        <p className="mb-4 text-sm text-slate-500">
          Facture {invoice.invoice_number} — {invoice.amount_total} {invoice.currency || "XOF"}
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="text-sm">
            Preuve de paiement (PDF, JPEG, PNG) *
            <input
              type="file"
              className="input mt-1 w-full text-xs"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required
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
            <button type="submit" className="btn-primary" disabled={!proof || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1 inline animate-spin" size={14} /> Confirmation…
                </>
              ) : (
                <>
                  <Upload size={14} className="mr-1 inline" /> Activer le forfait
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
