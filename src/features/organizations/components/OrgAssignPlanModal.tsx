import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Users } from "lucide-react";
import { formatMoneyFromApi } from "@/lib/money";
import type { AssignPlanPayload, PlanDowngradeMember, PlanDowngradeSelection } from "@/lib/adminApi";
import { isPlanDowngradeSelectionError, parseAssignPlanError } from "@/lib/assignPlanErrors";

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
  onClose: () => void;
  onSubmit: (payload: AssignPlanPayload) => Promise<unknown>;
};

export function OrgAssignPlanModal({
  orgName,
  currentPlanCode,
  plans,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const [adminNotes, setAdminNotes] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [trial, setTrial] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [downgrade, setDowngrade] = useState<PlanDowngradeSelection | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Omit<AssignPlanPayload, "retained_user_ids"> | null>(
    null,
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const seatsRequired = downgrade?.seats_total ?? 0;

  useEffect(() => {
    if (downgrade?.owner_id) {
      setSelectedMemberIds(new Set([downgrade.owner_id]));
    }
  }, [downgrade?.owner_id]);

  const toggleMember = (member: PlanDowngradeMember) => {
    if (member.is_owner) return;
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
      } else if (next.size < seatsRequired) {
        next.add(member.id);
      } else {
        const removable = [...next].find((id) => id !== downgrade?.owner_id);
        if (removable) next.delete(removable);
        next.add(member.id);
      }
      if (downgrade?.owner_id) next.add(downgrade.owner_id);
      return next;
    });
  };

  const buildPayload = (): Omit<AssignPlanPayload, "retained_user_ids"> | null => {
    if (!selectedPlanId || !adminNotes.trim()) return null;
    return {
      plan_id: selectedPlanId,
      admin_notes: adminNotes.trim(),
      billing_cycle: billingCycle,
      trial,
    };
  };

  const handleInitialSubmit = async () => {
    setError("");
    const payload = buildPayload();
    if (!payload) return;
    try {
      await onSubmit(payload);
    } catch (err) {
      const parsed = parseAssignPlanError(err);
      if (isPlanDowngradeSelectionError(parsed)) {
        setPendingPayload(payload);
        setDowngrade(parsed.downgrade);
        return;
      }
      setError(parsed.message);
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!pendingPayload || !downgrade) return;
    if (selectedMemberIds.size !== seatsRequired) {
      setError(`Sélectionnez exactement ${seatsRequired} membre(s) actif(s).`);
      return;
    }
    setError("");
    try {
      await onSubmit({
        ...pendingPayload,
        retained_user_ids: [...selectedMemberIds],
      });
    } catch (err) {
      const parsed = parseAssignPlanError(err);
      setError(parsed.message);
    }
  };

  const sortedMembers = useMemo(() => {
    if (!downgrade?.members) return [];
    return [...downgrade.members].sort((a, b) => {
      if (a.is_owner !== b.is_owner) return a.is_owner ? -1 : 1;
      return (a.full_name || a.email).localeCompare(b.full_name || b.email);
    });
  }, [downgrade?.members]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border-soft bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {downgrade ? "Choisir les membres actifs" : "Assigner un plan"}
            </h3>
            <p className="text-sm text-slate-500">{orgName}</p>
            {currentPlanCode && !downgrade ? (
              <p className="mt-1 text-xs text-slate-400">
                Plan actuel : <strong>{currentPlanCode}</strong>
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Fermer">
            ×
          </button>
        </div>

        {downgrade ? (
          <>
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
              <p className="m-0 flex items-start gap-2">
                <Users size={14} className="mt-0.5 shrink-0" />
                <span>
                  Le nouveau plan n&apos;autorise que <strong>{seatsRequired}</strong> siège(s) actif(s) mais{" "}
                  <strong>{downgrade.active_members}</strong> membre(s) sont actifs. Choisissez qui conserve
                  l&apos;accès — les autres seront <strong>suspendus</strong> (compte conservé, réactivation possible).
                </span>
              </p>
            </div>

            <p className="mb-2 text-xs font-medium text-slate-500">
              Sélection : {selectedMemberIds.size} / {seatsRequired}
            </p>

            <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
              {sortedMembers.map((member) => {
                const checked = selectedMemberIds.has(member.id);
                const disabled = member.is_owner;
                return (
                  <li key={member.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                        checked ? "bg-brand-purple-50 dark:bg-brand-purple-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      } ${disabled ? "cursor-default opacity-90" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled || isPending}
                        onChange={() => toggleMember(member)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate font-medium text-slate-900 dark:text-slate-100">
                          {member.full_name || member.email}
                          {member.is_owner ? (
                            <span className="ml-2 text-[10px] font-bold uppercase text-brand-purple-600">
                              Propriétaire
                            </span>
                          ) : null}
                        </p>
                        <p className="m-0 truncate text-xs text-slate-500">{member.email}</p>
                      </div>
                      {member.access_status !== "active" ? (
                        <span className="text-[10px] text-slate-400">{member.access_status}</span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>

            {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDowngrade(null);
                  setPendingPayload(null);
                  setError("");
                }}
              >
                Retour
              </button>
              <button
                type="button"
                className="btn-magenta"
                disabled={isPending || selectedMemberIds.size !== seatsRequired}
                onClick={handleConfirmDowngrade}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1 inline animate-spin" size={14} /> Migration…
                  </>
                ) : (
                  "Confirmer la migration"
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="m-0 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Action manuelle tracée dans le journal d&apos;audit. Un downgrade peut exiger de choisir les
                  membres actifs. Business : facture + paiement ou essai temporaire.
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
                placeholder="Ex. migration commerciale, correction erreur facturation…"
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
                    <p className="text-lg font-bold text-brand-purple-600">
                      {formatMoneyFromApi(plan.price_monthly)}
                    </p>
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
                onClick={handleInitialSubmit}
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
          </>
        )}
      </div>
    </div>
  );
}
