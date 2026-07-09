import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type PlatformPlan, type PlatformPlanUpsert } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { clientPageSlice } from "@/lib/pagination";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

type EnabledModuleRef = string | { code?: string | null };

function normalizeEnabledModuleCodes(modules: EnabledModuleRef[] | undefined): string[] {
  if (!modules?.length) return [];
  const codes: string[] = [];
  const seen = new Set<string>();
  for (const item of modules) {
    const code = typeof item === "string" ? item : item?.code;
    if (typeof code === "string" && code && !seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

function formatEnabledModulesLabel(modules: EnabledModuleRef[] | undefined): string {
  const codes = normalizeEnabledModuleCodes(modules);
  return codes.length ? codes.join(", ") : "—";
}

type PlanFormState = {
  name: string;
  code: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  included_seats: string;
  max_users_hard: string;
  included_credits: string;
  additional_seats_allowed: boolean;
  enabled_modules: string[];
  is_active: boolean;
  trial_enabled: boolean;
  trial_days: string;
};

const emptyForm: PlanFormState = {
  name: "",
  code: "",
  description: "",
  price_monthly: "",
  price_yearly: "",
  included_seats: "1",
  max_users_hard: "1",
  included_credits: "0",
  additional_seats_allowed: false,
  enabled_modules: [],
  is_active: true,
  trial_enabled: true,
  trial_days: "7",
};

function resolveTrialDays(form: PlanFormState): number {
  const parsed = Number(form.trial_days);
  if (!form.trial_enabled) return 0;
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function toFormState(plan: PlatformPlan): PlanFormState {
  const trialDays = plan.trial_days ?? 0;
  const trialEnabled = trialDays > 0;
  return {
    name: plan.name ?? "",
    code: plan.code ?? "",
    description: plan.description ?? "",
    price_monthly: String(plan.price_monthly ?? ""),
    price_yearly: String(plan.price_yearly ?? ""),
    included_seats: String(plan.limits?.included_seats ?? 1),
    max_users_hard: String(plan.limits?.max_users_hard ?? 1),
    included_credits: String(plan.limits?.included_credits ?? 0),
    additional_seats_allowed: Boolean(plan.limits?.additional_seats_allowed),
    enabled_modules: normalizeEnabledModuleCodes(plan.enabled_modules),
    is_active: Boolean(plan.is_active),
    trial_enabled: trialEnabled,
    trial_days: trialEnabled ? String(trialDays) : "0",
  };
}

function toPayload(form: PlanFormState, existingLimits?: PlatformPlan["limits"]): PlatformPlanUpsert {
  const trialDays = resolveTrialDays(form);
  const includedCredits = Number(form.included_credits);
  return {
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    description: form.description.trim(),
    price_monthly: form.price_monthly.trim(),
    price_yearly: form.price_yearly.trim(),
    trial_days: trialDays,
    limits: {
      ...(existingLimits ?? {}),
      included_seats: Number(form.included_seats),
      max_users_hard: Number(form.max_users_hard),
      additional_seats_allowed: form.additional_seats_allowed,
      included_credits: Number.isFinite(includedCredits) && includedCredits >= 0 ? Math.floor(includedCredits) : 0,
    },
    enabled_modules: form.enabled_modules,
    is_active: form.is_active,
  };
}

export function Plans() {
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, pageSize, resetPage } = usePaginationState(20);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const qc = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();

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
    mutationFn: (args: { id: string; payload: PlatformPlanUpsert }) => adminApi.patchLicensingPlan(args.id, args.payload),
    onSuccess: async (updatedPlan) => {
      setFeedback("Plan mis a jour.");
      setIsFormOpen(false);
      setEditingPlan(null);
      qc.setQueryData<PlatformPlan[]>(["platform-plans"], (current) => {
        if (!current?.length) return current;
        return current.map((plan) =>
          plan.id === updatedPlan.id ? { ...plan, ...updatedPlan, trial_days: updatedPlan.trial_days ?? 0 } : plan,
        );
      });
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
    onSettled: () => close(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteLicensingPlan(id),
    onSuccess: async () => {
      setFeedback("Plan supprime.");
      await qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
    onSettled: () => close(),
  });

  const isMutating = createMut.isPending || updateMut.isPending || toggleMut.isPending || deleteMut.isPending;
  const modules = useMemo(() => modulesQuery.data ?? [], [modulesQuery.data]);
  const allPlans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);

  const filteredPlans = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allPlans.filter((plan) => {
      if (activeFilter === "true" && !plan.is_active) return false;
      if (activeFilter === "false" && plan.is_active) return false;
      if (!q) return true;
      return plan.name.toLowerCase().includes(q) || plan.code.toLowerCase().includes(q);
    });
  }, [allPlans, debouncedSearch, activeFilter]);

  const { items: plans, total } = useMemo(
    () => clientPageSlice(filteredPlans, page, pageSize),
    [filteredPlans, page, pageSize],
  );

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
    const payload = toPayload(form, editingPlan?.limits);
    if (!editingPlan) {
      createMut.mutate(payload);
      return;
    }
    updateMut.mutate({ id: editingPlan.id, payload });
  };

  return (
    <ListPageShell>
      <PageHeader
        title="Plans"
        description="Offres PlatformPlan — tarifs, sièges et modules inclus."
        actions={
          <button type="button" className="btn-magenta" onClick={startCreate} disabled={isMutating}>
            Nouveau plan
          </button>
        }
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Nom ou code…"
        />
        <FilterSelect
          value={activeFilter}
          onChange={(v) => {
            setActiveFilter(v);
            resetPage();
          }}
          placeholder="Tous"
          options={[
            { value: "true", label: "Actifs" },
            { value: "false", label: "Inactifs" },
          ]}
        />
      </FilterBar>

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
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Essai</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Sieges inclus</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Credits inclus</th>
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
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                  {(plan.trial_days ?? 0) > 0 ? `${plan.trial_days} j` : "Non"}
                </td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.included_seats ?? "—"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                  {plan.limits?.included_credits != null
                    ? Number(plan.limits.included_credits).toLocaleString("fr-FR")
                    : "—"}
                </td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.max_users_hard ?? "—"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{plan.limits?.additional_seats_allowed ? "Oui" : "Non"}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatEnabledModulesLabel(plan.enabled_modules)}</td>
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
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => startEdit(plan)}
                      disabled={isMutating}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        ask({
                          description: plan.is_active
                            ? `Désactiver le plan « ${plan.name} » ?`
                            : `Activer le plan « ${plan.name} » ?`,
                          danger: plan.is_active,
                          confirmText: plan.is_active ? "Désactiver" : "Activer",
                          action: () => toggleMut.mutate({ id: plan.id, is_active: !plan.is_active }),
                        })
                      }
                      disabled={isMutating}
                    >
                      {plan.is_active ? "Desactiver" : "Activer"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger px-2 py-1 text-xs"
                      onClick={() =>
                        ask({
                          title: "Supprimer ce plan ?",
                          description: (
                            <>
                              Cette action supprimera le plan <strong>{plan.name}</strong>. Vérifiez qu&apos;aucune
                              organisation n&apos;est encore dessus.
                            </>
                          ),
                          danger: true,
                          confirmText: "Supprimer",
                          action: () => deleteMut.mutate(plan.id),
                        })
                      }
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
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

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
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Credits inclus / periode
                <input
                  type="number"
                  min={0}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={form.included_credits}
                  onChange={(e) => setForm((v) => ({ ...v, included_credits: e.target.value }))}
                />
                <span className="text-[11px] text-slate-500">0 = aucun credit offert (achat obligatoire)</span>
              </label>
              <label className="grid gap-1 text-xs text-slate-700 dark:text-slate-300">
                Jours d&apos;essai
                <input
                  type="number"
                  min={0}
                  disabled={!form.trial_enabled}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={form.trial_days}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = Number(value);
                    setForm((v) => ({
                      ...v,
                      trial_days: value,
                      trial_enabled: Number.isFinite(parsed) && parsed > 0 ? true : false,
                    }));
                  }}
                />
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
                  checked={form.trial_enabled}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      trial_enabled: e.target.checked,
                      trial_days: e.target.checked ? (Number(v.trial_days) > 0 ? v.trial_days : "7") : "0",
                    }))
                  }
                />
                Essai gratuit active
              </label>
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
                className="btn-secondary"
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
                className="btn-magenta"
                onClick={handleSubmit}
                disabled={isMutating}
              >
                {createMut.isPending || updateMut.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renderDialog(toggleMut.isPending || deleteMut.isPending)}
    </ListPageShell>
  );
}
