import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  orgId: string;
  orgName: string;
  defaultRecipientEmail?: string;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
};

export function CreateBusinessInvoiceModal({
  orgId,
  orgName,
  defaultRecipientEmail = "",
  onClose,
  onCreated,
  onError,
}: Props) {
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [recipientName, setRecipientName] = useState(orgName);
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
        <h2 className="mb-1 text-lg font-semibold">Facture Business</h2>
        <p className="mb-4 text-sm text-slate-500">{orgName}</p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
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
                onChange={(e) => setDeploymentType(e.target.value as "platform" | "dedicated")}
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
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            Envoyer la facture par e-mail immédiatement
          </label>
          <div className="mt-2 flex justify-end gap-2">
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
