import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type BusinessPlanRequestItem } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  orgId: string;
  orgName: string;
  defaultRecipientEmail?: string;
  sourceRequest?: BusinessPlanRequestItem;
  onClose: () => void;
  onCreated: () => void;
  onError: (msg: string) => void;
};

export function CreateBusinessInvoiceModal({
  orgId,
  orgName,
  defaultRecipientEmail = "",
  sourceRequest,
  onClose,
  onCreated,
  onError,
}: Props) {
  const queryClient = useQueryClient();
  const [recipientEmail, setRecipientEmail] = useState(
    sourceRequest?.contact_email || defaultRecipientEmail,
  );
  const [recipientName, setRecipientName] = useState(sourceRequest?.contact_name || orgName);
  const [deploymentType, setDeploymentType] = useState<"platform" | "dedicated">(
    sourceRequest?.deployment_type || "platform",
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    sourceRequest?.billing_cycle || "yearly",
  );
  const [includedSeats, setIncludedSeats] = useState(sourceRequest?.estimated_seats ?? 25);
  const [maxWarehouses, setMaxWarehouses] = useState(25);
  const [amountTotal, setAmountTotal] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [notes, setNotes] = useState(sourceRequest?.message || "");

  const { data: orgMeta } = useQuery({
    queryKey: ["org-detail", orgId],
    queryFn: () => adminApi.organizationDetail(orgId),
  });

  useEffect(() => {
    if (!orgMeta) return;
    const fromOverride = orgMeta.max_warehouses_override;
    const fromMax = orgMeta.warehouses_max;
    const fromIncluded = orgMeta.warehouses_included;
    const next = fromOverride ?? fromMax ?? fromIncluded ?? 25;
    if (typeof next === "number" && next >= 1) setMaxWarehouses(next);
  }, [orgMeta]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const invoice = await adminApi.createBusinessInvoice({
        org_id: orgId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        deployment_type: deploymentType,
        billing_cycle: billingCycle,
        included_seats: includedSeats,
        amount_total: amountTotal,
        send_email: sendEmail,
        notes,
        business_plan_request_id: sourceRequest?.id,
      });
      // La facture Business n'a pas encore de champ entrepôts côté API :
      // on applique le plafond via l'override org (endpoint existant).
      if (Number.isInteger(maxWarehouses) && maxWarehouses >= 1) {
        await adminApi.patchOrganizationWarehousesOverride(orgId, {
          max_warehouses_override: maxWarehouses,
        });
        await queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
      }
      return invoice;
    },
    onSuccess: onCreated,
    onError: (err) => onError(getErrorMessage(err)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold">Facture Business</h2>
        <p className="mb-4 text-sm text-slate-500">{orgName}</p>
        {sourceRequest ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>Demande {sourceRequest.reference}</strong>
            <span className="block text-xs opacity-90">
              {sourceRequest.estimated_seats} sièges ·{" "}
              {sourceRequest.deployment_type === "platform" ? "Plateforme" : "Dédié"} ·{" "}
              {sourceRequest.billing_cycle === "monthly" ? "Mensuel" : "Annuel"}
            </span>
          </div>
        ) : null}
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
              Plafond entrepôts
              <input
                type="number"
                min={1}
                className="input mt-1 w-full"
                value={maxWarehouses}
                onChange={(e) => setMaxWarehouses(Number(e.target.value))}
                required
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Appliqué immédiatement en override org (défaut plan Business : 25).
              </span>
            </label>
          </div>
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
          <label className="text-sm">
            Notes internes
            <textarea
              className="input mt-1 w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="size-4 shrink-0"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            <span>Envoyer la facture par e-mail immédiatement</span>
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
