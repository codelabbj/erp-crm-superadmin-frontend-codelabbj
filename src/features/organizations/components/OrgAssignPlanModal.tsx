import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatMoneyFromApi } from "@/lib/money";
import type { AssignPlanPayload } from "@/lib/adminApi";

type PlanOption = {
  id: string;
  code?: string;
  name: string;
  limits: { included_seats: number };
  price_monthly: string | number;
};

type Props = {
  orgName: string;
  currentPlanCode?: string | null;
  plans: PlanOption[];
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (payload: AssignPlanPayload) => void;
};

export function OrgAssignPlanModal({
  orgName,
  currentPlanCode,
  plans,
  isPending,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [adminNotes, setAdminNotes] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [trial, setTrial] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-soft bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assigner un plan</h3>
            <p className="text-sm text-slate-500">{orgName}</p>
            {currentPlanCode ? (
              <p className="mt-1 text-xs text-slate-400">
                Plan actuel : <strong>{currentPlanCode}</strong> — la migration remplace l&apos;offre sans passer par un paiement.
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Fermer">
            ×
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="m-0 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Action manuelle tracée dans le journal d&apos;audit. Le forfait <strong>Business</strong> doit
              normalement être activé via facture + paiement client (PAL ou virement).
            </span>
          </p>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
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
          <label className="flex items-end gap-2 pb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={trial} onChange={(e) => setTrial(e.target.checked)} />
            Activer en essai (14 j par défaut)
          </label>
        </div>

        <label className="mb-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
          Motif / note audit *
          <textarea
            className="input mt-1 w-full"
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Ex. migration commerciale, correction erreur facturation, partenaire pilote…"
            required
          />
        </label>

        <div className="grid gap-2">
          {plans.map((plan) => {
            const isBusiness = plan.code === "business";
            const disabled = isBusiness && !trial;
            return (
              <button
                key={plan.id}
                type="button"
                disabled={isPending || disabled}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                  selectedPlanId === plan.id
                    ? "border-brand-purple-500 bg-brand-purple-50/60 dark:bg-brand-purple-900/20"
                    : "border-slate-200 hover:border-brand-purple-300 dark:border-slate-700"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</h4>
                  <p className="text-xs text-slate-500">
                    {plan.limits.included_seats} sièges catalogue
                    {isBusiness && !trial ? " — via facturation uniquement" : ""}
                  </p>
                </div>
                <p className="text-lg font-bold text-brand-purple-600">{formatMoneyFromApi(plan.price_monthly)}</p>
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-magenta"
            disabled={!selectedPlanId || !adminNotes.trim() || isPending}
            onClick={() => {
              if (!selectedPlanId) return;
              onSubmit({
                plan_id: selectedPlanId,
                admin_notes: adminNotes.trim(),
                billing_cycle: billingCycle,
                trial,
              });
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 inline animate-spin" size={14} /> Assignation…
              </>
            ) : (
              `Confirmer${selectedPlan ? ` — ${selectedPlan.name}` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
