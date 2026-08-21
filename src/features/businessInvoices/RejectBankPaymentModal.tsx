import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { adminApi, type BusinessInvoiceItem } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  invoice: BusinessInvoiceItem;
  onClose: () => void;
  onRejected: () => void;
};

export function RejectBankPaymentModal({ invoice, onClose, onRejected }: Props) {
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.rejectBusinessInvoiceBankPayment(invoice.id, {
        admin_notes: adminNotes,
      }),
    onSuccess: () => onRejected(),
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold">Rejeter le virement</h2>
        <p className="mb-4 text-sm text-slate-500">
          Facture {invoice.invoice_number} — le client pourra soumettre une nouvelle preuve.
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="text-sm">
            Motif du rejet (visible implicitement — le client verra ce message)
            <textarea
              className="input mt-1 w-full"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Montant incorrect, référence manquante, reçu illisible…"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-secondary text-red-700"
              disabled={!adminNotes.trim() || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1 inline animate-spin" size={14} /> Rejet…
                </>
              ) : (
                <>
                  <XCircle size={14} className="mr-1 inline" /> Rejeter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
