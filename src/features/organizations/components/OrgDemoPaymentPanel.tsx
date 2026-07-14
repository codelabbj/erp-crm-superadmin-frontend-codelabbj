import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { adminApi, type OrganizationDetail } from "@/lib/adminApi";
import { formatIsoDate } from "@/lib/ui";

type Props = {
  orgId: string;
  orgMeta: OrganizationDetail;
};

export function OrgDemoPaymentPanel({ orgId, orgMeta }: Props) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(Boolean(orgMeta.allow_demo_payment));
  const [expiresLocal, setExpiresLocal] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEnabled(Boolean(orgMeta.allow_demo_payment));
    if (orgMeta.demo_payment_expires_at) {
      const d = new Date(orgMeta.demo_payment_expires_at);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        setExpiresLocal(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
        );
        return;
      }
    }
    setExpiresLocal("");
  }, [orgMeta.allow_demo_payment, orgMeta.demo_payment_expires_at]);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationDemoPayment(orgId, {
        allow_demo_payment: enabled,
        demo_payment_expires_at: enabled
          ? expiresLocal
            ? new Date(expiresLocal).toISOString()
            : null
          : null,
      }),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Impossible d'enregistrer l'autorisation démo.";
      setError(String(msg));
    },
  });

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    setExpiresLocal(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
    setEnabled(true);
  };

  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
        <ShieldCheck size={14} /> Paiement démo
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Autorise cette organisation à utiliser le numéro démo (<code>0000000000</code>) pour
        activer un plan / crédits sans paiement réel. Désactivé par défaut.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge active={Boolean(orgMeta.demo_payment_active)} />
        {orgMeta.demo_payment_expires_at ? (
          <span className="text-xs text-slate-500">
            Expire le {formatIsoDate(orgMeta.demo_payment_expires_at)}
          </span>
        ) : orgMeta.allow_demo_payment ? (
          <span className="text-xs text-slate-500">Sans date d&apos;expiration</span>
        ) : null}
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Autoriser le paiement démo
      </label>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="demo-expires">
          Expiration (optionnel)
        </label>
        <input
          id="demo-expires"
          type="datetime-local"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={expiresLocal}
          onChange={(e) => setExpiresLocal(e.target.value)}
          disabled={!enabled}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="text-xs text-brand-purple-600 underline" onClick={() => setPresetDays(7)}>
            +7 jours
          </button>
          <button type="button" className="text-xs text-brand-purple-600 underline" onClick={() => setPresetDays(30)}>
            +30 jours
          </button>
          <button
            type="button"
            className="text-xs text-slate-500 underline"
            onClick={() => setExpiresLocal("")}
            disabled={!enabled}
          >
            Sans expiration
          </button>
        </div>
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
