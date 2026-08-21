import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { adminApi, type OrganizationDetail } from "@/lib/adminApi";

type Props = {
  orgId: string;
  orgMeta: OrganizationDetail;
};

export function OrgFlatFeePanel({ orgId, orgMeta }: Props) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(Boolean(orgMeta.subscription_flat_fee_enabled));
  const [amount, setAmount] = useState(
    orgMeta.subscription_flat_fee_amount ? String(orgMeta.subscription_flat_fee_amount) : "100",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setEnabled(Boolean(orgMeta.subscription_flat_fee_enabled));
    if (orgMeta.subscription_flat_fee_amount) {
      setAmount(String(orgMeta.subscription_flat_fee_amount));
    }
  }, [orgMeta.subscription_flat_fee_enabled, orgMeta.subscription_flat_fee_amount]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationFlatFee(orgId, {
        subscription_flat_fee_enabled: enabled,
        subscription_flat_fee_amount: amount,
      }),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Impossible d'enregistrer le frais fixe.";
      setError(String(msg));
    },
  });

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
        <Banknote size={14} /> Frais fixe par abonnement
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Si activé, <strong>peu importe le nombre d&apos;abonnements lancés</strong> par cette organisation,
        c&apos;est le montant fixe défini ci-dessous qui est débité à chaque souscription (au lieu du prix du plan).
      </p>

      <div className="mb-3 flex items-center gap-2">
        <StatusBadge active={enabled} />
        {enabled ? (
          <span className="text-xs text-slate-500">
            {amount} {orgMeta.currency || "XOF"} par abonnement
          </span>
        ) : (
          <span className="text-xs text-slate-400">Désactivé — prix du plan appliqué</span>
        )}
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Activer le frais fixe
      </label>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="flat-fee-amount">
          Montant fixe ({orgMeta.currency || "XOF"})
        </label>
        <input
          id="flat-fee-amount"
          type="number"
          min={0}
          step={1}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!enabled}
        />
      </div>

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}

      <button
        type="button"
        className="rounded-lg bg-brand-purple-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
