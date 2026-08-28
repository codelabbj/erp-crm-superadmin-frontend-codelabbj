import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse } from "lucide-react";
import { adminApi, type OrganizationDetail } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  orgId: string;
  orgMeta: OrganizationDetail;
  /** Compact : intégré dans la carte Plan & sièges. */
  embedded?: boolean;
  /** Masque les contrôles d'écriture (permission orgs.write). */
  readOnly?: boolean;
};

const OVERRIDE_PLAN_CODES = new Set(["business", "enterprise"]);

function planAllowsOverride(planCode: string | null | undefined): boolean {
  return OVERRIDE_PLAN_CODES.has((planCode ?? "").toLowerCase());
}

export function OrgWarehousesQuotaPanel({ orgId, orgMeta, embedded = false, readOnly = false }: Props) {
  const queryClient = useQueryClient();
  const canOverride = !readOnly && planAllowsOverride(orgMeta.plan_code);
  const [overrideInput, setOverrideInput] = useState(
    orgMeta.max_warehouses_override != null ? String(orgMeta.max_warehouses_override) : "",
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setOverrideInput(orgMeta.max_warehouses_override != null ? String(orgMeta.max_warehouses_override) : "");
  }, [orgMeta.max_warehouses_override, orgMeta.id]);

  const used = orgMeta.warehouses_used ?? 0;
  const max = orgMeta.warehouses_max ?? orgMeta.warehouses_included ?? null;
  const included = orgMeta.warehouses_included;
  const atLimit = Boolean(orgMeta.warehouses_at_limit) || (max != null && max > 0 && used >= max);
  const pct = max != null && max > 0 ? Math.min(100, Math.round((used / max) * 100)) : null;

  const mutation = useMutation({
    mutationFn: (value: number | null) =>
      adminApi.patchOrganizationWarehousesOverride(orgId, { max_warehouses_override: value }),
    onSuccess: async () => {
      setError("");
      setFeedback("Plafond entrepôts enregistré.");
      await queryClient.invalidateQueries({ queryKey: ["org-detail", orgId] });
      window.setTimeout(() => setFeedback(""), 2500);
    },
    onError: (err) => {
      setFeedback("");
      setError(getErrorMessage(err));
    },
  });

  const handleSave = () => {
    setError("");
    const trimmed = overrideInput.trim();
    if (trimmed === "") {
      mutation.mutate(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1) {
      setError("Saisissez un entier ≥ 1, ou laissez vide pour le défaut du plan.");
      return;
    }
    mutation.mutate(n);
  };

  const shellClass = embedded
    ? "mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"
    : "rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  return (
    <section className={shellClass}>
      <h3
        className={`mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase ${
          embedded ? "" : ""
        }`}
      >
        <Warehouse size={14} /> Entrepôts
      </h3>

      {max != null ? (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-slate-500">Utilisés / plafond</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {used} / {max}
              {included != null && orgMeta.max_warehouses_override != null
                ? ` (plan ${included})`
                : null}
            </span>
          </div>
          {pct != null ? (
            <>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    atLimit || pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {pct} % · {atLimit ? "Limite atteinte" : "Capacité disponible"}
                {orgMeta.max_warehouses_override != null
                  ? ` · override ${orgMeta.max_warehouses_override}`
                  : " · défaut plan"}
              </p>
            </>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 text-xs text-slate-400">Quota entrepôts non renvoyé par l&apos;API.</p>
      )}

      {canOverride ? (
        <>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor={`wh-override-${orgId}`}>
            Plafond entrepôts (override)
          </label>
          <input
            id={`wh-override-${orgId}`}
            type="number"
            min={1}
            step={1}
            className="mb-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={overrideInput}
            onChange={(e) => setOverrideInput(e.target.value)}
            placeholder="Vide = défaut du plan"
            disabled={mutation.isPending}
          />
          <p className="mb-3 text-[11px] text-slate-400">
            Vide = défaut du plan (Business / Enterprise : 25). Effacer le champ puis enregistrer pour
            revenir au défaut.
          </p>
          {error ? <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          {feedback ? <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400">{feedback}</p> : null}
          <button
            type="button"
            className="rounded-lg bg-brand-purple-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={mutation.isPending}
            onClick={handleSave}
          >
            {mutation.isPending ? "Enregistrement…" : "Enregistrer le plafond"}
          </button>
        </>
      ) : (
        <p className="m-0 text-[11px] text-slate-400">
          Lecture seule sur ce forfait. L&apos;override est disponible pour Business / Enterprise.
        </p>
      )}
    </section>
  );
}
