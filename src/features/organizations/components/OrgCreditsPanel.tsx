import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Plus, RefreshCw } from "lucide-react";
import { adminApi, type OrgCreditsPayload } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

type Props = {
  orgId: string;
};

const EMPTY_RATES = {
  email_credits_per_send: "",
  whatsapp_credits_per_message: "",
  sms_credits_per_message: "",
  ai_weighted_tokens_per_credit: "",
  ai_output_token_weight: "",
  low_balance_threshold: "",
  included_credits_override: "",
};

export function OrgCreditsPanel({ orgId }: Props) {
  const queryClient = useQueryClient();
  const [grantAmount, setGrantAmount] = useState("1000");
  const [grantReason, setGrantReason] = useState("");
  const [rates, setRates] = useState(EMPTY_RATES);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["org-credits", orgId],
    queryFn: () => adminApi.organizationCredits(orgId),
  });

  const grantMut = useMutation({
    mutationFn: () =>
      adminApi.grantOrganizationCredits(orgId, {
        amount: Number.parseInt(grantAmount, 10),
        reason: grantReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-credits", orgId] });
      setGrantReason("");
    },
  });

  const patchRatesMut = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationCredits(orgId, {
        email_credits_per_send: rates.email_credits_per_send ? Number(rates.email_credits_per_send) : undefined,
        whatsapp_credits_per_message: rates.whatsapp_credits_per_message
          ? Number(rates.whatsapp_credits_per_message)
          : undefined,
        sms_credits_per_message: rates.sms_credits_per_message ? Number(rates.sms_credits_per_message) : undefined,
        ai_weighted_tokens_per_credit: rates.ai_weighted_tokens_per_credit
          ? Number(rates.ai_weighted_tokens_per_credit)
          : undefined,
        ai_output_token_weight: rates.ai_output_token_weight ? Number(rates.ai_output_token_weight) : undefined,
        low_balance_threshold: rates.low_balance_threshold ? Number(rates.low_balance_threshold) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-credits", orgId] });
      setRates((prev) => ({
        ...EMPTY_RATES,
        included_credits_override: prev.included_credits_override,
      }));
    },
  });

  const patchPolicyMut = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationCredits(orgId, {
        included_credits_override:
          rates.included_credits_override !== ""
            ? Number(rates.included_credits_override)
            : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-credits", orgId] });
      setRates((prev) => ({ ...EMPTY_RATES, included_credits_override: prev.included_credits_override }));
    },
  });

  const resetPolicyMut = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationCredits(orgId, {
        clear_fields: ["included_credits_override"],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-credits", orgId] });
      setRates((prev) => ({ ...prev, included_credits_override: "" }));
    },
  });

  const resetRatesMut = useMutation({
    mutationFn: () =>
      adminApi.patchOrganizationCredits(orgId, {
        clear_fields: [
          "email_credits_per_send",
          "whatsapp_credits_per_message",
          "sms_credits_per_message",
          "ai_weighted_tokens_per_credit",
          "ai_output_token_weight",
          "low_balance_threshold",
        ],
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-credits", orgId] }),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Chargement des crédits…</p>;
  }

  const effective = data.effective_rates ?? data.credits_rates;
  const policy = data.plan_credit_policy ?? data.credits_plan_policy;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Coins size={20} className="text-brand-purple-600" />
            Crédits OwoDesk
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Monnaie commune : email, WhatsApp, SMS et IA. Les crédits inclus par période se configurent sur le plan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-700"
        >
          <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Solde</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-brand-purple-700 dark:text-brand-purple-300">
            {(data.credits_balance ?? 0).toLocaleString("fr-FR")}
          </p>
          {data.credits_low_balance ? (
            <p className="mt-1 text-xs text-amber-600">Solde bas</p>
          ) : null}
        </div>
        <RateCard label="Email / envoi" value={effective?.email_credits_per_send} suffix="cr." />
        <RateCard label="WhatsApp / msg" value={effective?.whatsapp_credits_per_message} suffix="cr." />
        <RateCard label="SMS / msg" value={effective?.sms_credits_per_message} suffix="cr." />
        <RateCard
          label="IA / crédit"
          value={effective?.ai_weighted_tokens_per_credit}
          suffix="tokens pond."
        />
      </div>

      {policy ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h4 className="text-sm font-semibold">Crédits inclus (plan {policy.plan_code ?? "—"})</h4>
          <p className="mt-1 text-sm text-slate-500">
            Montant défini sur le plan. 0 = aucun crédit offert à l&apos;activation.
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium tabular-nums">
                {policy.included_credits_plan.toLocaleString("fr-FR")} cr./période
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Effectif pour ce client</dt>
              <dd className="font-medium tabular-nums">
                {policy.included_credits_effective.toLocaleString("fr-FR")} cr./période
                {policy.included_credits_override != null ? (
                  <span className="ml-1 text-xs text-amber-600">(override)</span>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="text-sm font-semibold">Accorder des crédits</h4>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            type="number"
            min={1}
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Montant"
          />
          <input
            type="text"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            placeholder="Motif (optionnel)"
          />
          <button
            type="button"
            disabled={grantMut.isPending}
            onClick={() => grantMut.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-purple-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} />
            Accorder
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Override crédits inclus (client)</h4>
          <button
            type="button"
            onClick={() => resetPolicyMut.mutate()}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Réinitialiser
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Remplace le montant du plan pour ce client uniquement. Laissez vide pour hériter du plan.
        </p>
        <label className="mt-3 block text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400">Crédits / période</span>
          <input
            type="number"
            min={0}
            placeholder={
              data.rate_overrides?.included_credits_override != null
                ? String(data.rate_overrides.included_credits_override)
                : policy
                  ? String(policy.included_credits_plan)
                  : "0"
            }
            value={rates.included_credits_override}
            onChange={(e) => setRates((prev) => ({ ...prev, included_credits_override: e.target.value }))}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <button
          type="button"
          disabled={patchPolicyMut.isPending}
          onClick={() => patchPolicyMut.mutate()}
          className="mt-4 rounded-lg border border-brand-purple-200 bg-brand-purple-50 px-4 py-2 text-sm font-medium text-brand-purple-800 dark:border-brand-purple-800 dark:bg-brand-purple-900/30 dark:text-brand-purple-200"
        >
          Enregistrer l&apos;override
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Tarifs personnalisés (client)</h4>
          <button
            type="button"
            onClick={() => resetRatesMut.mutate()}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Réinitialiser défauts
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["email_credits_per_send", "Email / envoi"],
              ["whatsapp_credits_per_message", "WhatsApp / message"],
              ["sms_credits_per_message", "SMS / message"],
              ["ai_weighted_tokens_per_credit", "Tokens IA / crédit"],
              ["ai_output_token_weight", "Poids output IA"],
              ["low_balance_threshold", "Seuil alerte solde"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
              <input
                type="number"
                step={key === "ai_output_token_weight" ? "0.1" : "1"}
                placeholder={
                  data.rate_overrides?.[key] != null
                    ? String(data.rate_overrides[key])
                    : String((effective as Record<string, unknown>)?.[key] ?? "")
                }
                value={rates[key]}
                onChange={(e) => setRates((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={patchRatesMut.isPending}
          onClick={() => patchRatesMut.mutate()}
          className="mt-4 rounded-lg border border-brand-purple-200 bg-brand-purple-50 px-4 py-2 text-sm font-medium text-brand-purple-800 dark:border-brand-purple-800 dark:bg-brand-purple-900/30 dark:text-brand-purple-200"
        >
          Enregistrer les tarifs
        </button>
      </div>

      <LedgerTable entries={data.ledger?.results ?? []} />
    </div>
  );
}

function RateCard({ label, value, suffix }: { label: string; value?: number; suffix: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value ?? "—"} <span className="text-sm font-normal text-slate-500">{suffix}</span>
      </p>
    </div>
  );
}

function LedgerTable({ entries }: { entries: OrgCreditsPayload["ledger"]["results"] }) {
  if (!entries.length) {
    return <p className="text-sm text-slate-500">Aucun mouvement récent.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Canal</th>
            <th className="px-4 py-2">Delta</th>
            <th className="px-4 py-2">Solde après</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2 whitespace-nowrap">
                {new Date(e.created_at).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-2">{e.channel}</td>
              <td
                className={cn(
                  "px-4 py-2 font-medium tabular-nums",
                  e.delta >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {e.delta >= 0 ? `+${e.delta}` : e.delta}
              </td>
              <td className="px-4 py-2 tabular-nums">{e.balance_after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
