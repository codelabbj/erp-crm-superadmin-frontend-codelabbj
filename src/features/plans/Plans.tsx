import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type PlatformPlan, type PlatformPlanUpsert } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

type PlanFormState = {
  name: string;
  code: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  included_seats: string;
  max_users_hard: string;
  additional_seats_allowed: boolean;
  enabled_modules: string[];
  is_active: boolean;
};

const emptyForm: PlanFormState = {
  name: "",
  code: "",
  description: "",
  price_monthly: "",
  price_yearly: "",
  included_seats: "1",
  max_users_hard: "1",
  additional_seats_allowed: false,
  enabled_modules: [],
  is_active: true,
};

function toFormState(plan: PlatformPlan): PlanFormState {
  return {
    name: plan.name ?? "",
    code: plan.code ?? "",
    description: plan.description ?? "",
    price_monthly: String(plan.price_monthly ?? ""),
    price_yearly: String(plan.price_yearly ?? ""),
    included_seats: String(plan.limits?.included_seats ?? 1),
    max_users_hard: String(plan.limits?.max_users_hard ?? 1),
    additional_seats_allowed: Boolean(plan.limits?.additional_seats_allowed),
    enabled_modules: plan.enabled_modules ?? [],
    is_active: Boolean(plan.is_active),
  };
}

function toPayload(form: PlanFormState): PlatformPlanUpsert {
  return {
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    description: form.description.trim(),
    price_monthly: form.price_monthly.trim(),
    price_yearly: form.price_yearly.trim(),
    limits: {
      included_seats: Number(form.included_seats),
      max_users_hard: Number(form.max_users_hard),
      additional_seats_allowed: form.additional_seats_allowed,
    },
    enabled_modules: form.enabled_modules,
    is_active: form.is_active,
  };
}

export function Plans() {
  const [feedback, setFeedback] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const [deletingPlan, setDeletingPlan] = useState<PlatformPlan | null>(null);
  const qc = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ["platform-plans"],
    queryFn: () => adminApi.licensingPlans(),
  });
  const modulesQuery = useQuery({
    queryKey: ["licensing-modules"],
    queryFn: () => adminApi.licensingModules(),
  });

  const createMut = useMutation({
    mutationFn: (payload: PlatformPlanUpsert) => adminApi.createLicensingPlan(payload),
    onSuccess: async () => {
      setFeedback("Plan cree avec succes.");
      setIsFormOpen(false);
      setEditingPlan(null);
      setForm(emptyForm);
      await qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const updateMut = useMutation({
    mutationFn: (args: { id: string; payload: PlatformPlanUpsert }) => adminApi.updateLicensingPlan(args.id, args.payload),
    onSuccess: async () => {
      setFeedback("Plan mis a jour.");
      setIsFormOpen(false);
      setEditingPlan(null);
      await qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const toggleMut = useMutation({
    mutationFn: (args: { id: string; is_active: boolean }) => adminApi.toggleLicensingPlanActive(args.id, args.is_active),
    onSuccess: async () => {
      setFeedback("Statut du plan mis a jour.");
      await qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteLicensingPlan(id),
    onSuccess: async () => {
      setFeedback("Plan supprime.");
      setDeletingPlan(null);
      await qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const isMutating = createMut.isPending || updateMut.isPending || toggleMut.isPending || deleteMut.isPending;
  const modules = useMemo(() => modulesQuery.data ?? [], [modulesQuery.data]);
  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);

  const startCreate = () => {
    setIsFormOpen(true);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const startEdit = (plan: PlatformPlan) => {
    setIsFormOpen(true);
    setEditingPlan(plan);
    setForm(toFormState(plan));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim() || !form.price_monthly.trim() || !form.price_yearly.trim()) {
      setFeedback("Merci de renseigner les champs obligatoires du plan.");
      return;
    }
    const payload = toPayload(form);
    if (!editingPlan) {
      createMut.mutate(payload);
      return;
    }
    updateMut.mutate({ id: editingPlan.id, payload });
  };

  return (
    <section className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Plans (PlatformPlan)</h3>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
          onClick={startCreate}
          disabled={isMutating}
        >
          Nouveau plan
        </button>
      </div>

      {feedback ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {plansQuery.isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {plansQuery.isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(plansQuery.error)}</p> : null}

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Nom</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Code</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Mensuel</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Annuel</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Sieges inclus</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Sieges max</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Sieges additionnels</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Modules</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actif</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{plan.name}</td>
                <td className="px-2 py-2">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{plan.code}</code>
                </td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{String(plan.price_monthly)}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{String(plan.price_yearly)}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.included_seats ?? "—"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.max_users_hard ?? "—"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.additional_seats_allowed ? "Oui" : "Non"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{(plan.enabled_modules ?? []).join(", ") || "—"}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      plan.is_active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {plan.is_active ? "Oui" : "Non"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                      onClick={() => startEdit(plan)}
                      disabled={isMutating}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                      onClick={() => toggleMut.mutate({ id: plan.id, is_active: !plan.is_active })}
                      disabled={isMutating}
                    >
                      {plan.is_active ? "Desactiver" : "Activer"}
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-900/20"
                      onClick={() => setDeletingPlan(plan)}
                      disabled={isMutating}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-gray-900/55 p-4">
          <div className="grid w-[min(95vw,760px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">
              {editingPlan ? "Modifier le plan" : "Creer un plan"}
            </h4>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Nom du plan *
                <input className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Code *
                <input className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300 md:col-span-2">
                Description
                <textarea className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" rows={3} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Prix mensuel *
                <input type="number" step="0.01" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.price_monthly} onChange={(e) => setForm((v) => ({ ...v, price_monthly: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Prix annuel *
                <input type="number" step="0.01" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.price_yearly} onChange={(e) => setForm((v) => ({ ...v, price_yearly: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Sieges inclus *
                <input type="number" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.included_seats} onChange={(e) => setForm((v) => ({ ...v, included_seats: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Sieges max (hard) *
                <input type="number" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={form.max_users_hard} onChange={(e) => setForm((v) => ({ ...v, max_users_hard: e.target.value }))} />
              </label>
            </div>

            <div className="grid gap-2">
              <p className="m-0 text-xs font-semibold text-slate-700 dark:text-slate-300">Modules inclus</p>
              <div className="flex flex-wrap gap-2">
                {modules.map((module) => {
                  const checked = form.enabled_modules.includes(module.code);
                  return (
                    <label key={module.id} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((v) => ({
                            ...v,
                            enabled_modules: e.target.checked
                              ? [...v.enabled_modules, module.code]
                              : v.enabled_modules.filter((c) => c !== module.code),
                          }))
                        }
                      />
                      {module.code}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.additional_seats_allowed}
                  onChange={(e) => setForm((v) => ({ ...v, additional_seats_allowed: e.target.checked }))}
                />
                Sieges additionnels autorises
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((v) => ({ ...v, is_active: e.target.checked }))} />
                Plan actif
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPlan(null);
                  setForm(emptyForm);
                }}
                disabled={isMutating}
              >
                Annuler
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleSubmit}
                disabled={isMutating}
              >
                {createMut.isPending || updateMut.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingPlan ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-gray-900/55 p-4">
          <div className="grid w-[min(92vw,420px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Supprimer ce plan ?</h4>
            <p className="m-0 text-sm text-gray-700 dark:text-slate-300">
              Cette action supprimera le plan <strong>{deletingPlan.name}</strong>. Verifie d&apos;abord qu&apos;aucune organisation n&apos;est encore dessus.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => setDeletingPlan(null)}
                disabled={deleteMut.isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-red-600 bg-red-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => deleteMut.mutate(deletingPlan.id)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
