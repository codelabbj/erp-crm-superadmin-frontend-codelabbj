import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ToggleLeft, ToggleRight, Building2, Globe } from "lucide-react";
import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

export function FeatureFlags() {
  const [activeTab, setActiveTab] = useState<"global" | "overrides">("global");
  const queryClient = useQueryClient();

  const { data: globalFlags, isLoading: isFlagsLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: () => adminApi.featureFlags(),
  });

  const { data: overrides, isLoading: isOverridesLoading } = useQuery({
    queryKey: ["admin-feature-flag-overrides"],
    queryFn: () => adminApi.featureFlagOverrides(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newOverride, setNewOverride] = useState({ flag_key: "", is_enabled: true, tenant_id: "" });

  const upsertOverrideMutation = useMutation({
    mutationFn: (payload: { flag_key: string; is_enabled: boolean; tenant_id?: string }) => 
      adminApi.upsertFeatureFlagOverride(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flag-overrides"] });
      setIsModalOpen(false);
      setModalError("");
      setNewOverride({ flag_key: "", is_enabled: true, tenant_id: "" });
    },
    onError: (e: unknown) => setModalError(getErrorMessage(e)),
  });

  const patchFlagMutation = useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: any }) => adminApi.patchFeatureFlag(key, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Feature Flags</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Contrôlez le déploiement des fonctionnalités sur la plateforme.</p>
        </div>
      </header>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit">
        <button
          onClick={() => setActiveTab("global")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "global"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Flags Globaux
        </button>
        <button
          onClick={() => setActiveTab("overrides")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "overrides"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Overrides
        </button>
      </div>

      {activeTab === "global" ? (
        <div className="grid gap-4">
          {isFlagsLoading ? (
            <p className="text-center py-12 text-slate-400">Chargement des flags...</p>
          ) : globalFlags?.map((flag) => (
            <div key={flag.flag_key} className="flex items-center justify-between rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{flag.flag_key}</span>
                  {flag.default_enabled ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Actif par défaut</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">Inactif par défaut</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{flag.description}</p>
              </div>
              <button
                onClick={() => patchFlagMutation.mutate({ key: flag.flag_key, payload: { default_enabled: !flag.default_enabled } })}
                className="text-slate-400 transition hover:text-brand-purple-600 dark:hover:text-brand-magenta-500"
              >
                {flag.default_enabled ? <ToggleRight size={40} className="text-brand-purple-600 dark:text-brand-magenta-500" /> : <ToggleLeft size={40} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Surcharges actives</h3>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary px-3 py-1.5 text-xs">
              <Plus size={14} /> Créer un override
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Flag</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft dark:divide-slate-800">
                {isOverridesLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                ) : overrides?.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucun override configuré.</td></tr>
                ) : overrides?.map((override) => (
                  <tr key={override.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{override.flag_key}</td>
                    <td className="px-6 py-4">
                      {override.scope === "global" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><Globe size={12} /> Global</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-purple-600 dark:text-brand-purple-400"><Building2 size={12} /> Tenant</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{override.tenant_id || "—"}</td>
                    <td className="px-6 py-4">
                      {override.is_enabled ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Activé</span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Désactivé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn-ghost h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:bg-rose-900/20">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouvel Override</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn-ghost h-9 w-9 p-0 text-slate-400"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Clé du Flag</label>
                <select 
                  value={newOverride.flag_key}
                  onChange={(e) => setNewOverride({ ...newOverride, flag_key: e.target.value })}
                  className="w-full"
                >
                  <option value="">Sélectionner un flag...</option>
                  {globalFlags?.map((f) => (
                    <option key={f.flag_key} value={f.flag_key}>{f.flag_key}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">ID du Tenant (optionnel)</label>
                <input 
                  value={newOverride.tenant_id}
                  onChange={(e) => setNewOverride({ ...newOverride, tenant_id: e.target.value })}
                  placeholder="Laisser vide pour global"
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">État du Flag</span>
                <button
                  onClick={() => setNewOverride({ ...newOverride, is_enabled: !newOverride.is_enabled })}
                  className="text-slate-400 transition hover:text-brand-purple-600"
                >
                  {newOverride.is_enabled ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} />}
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button 
                disabled={upsertOverrideMutation.isPending || !newOverride.flag_key}
                onClick={() => { setModalError(""); upsertOverrideMutation.mutate(newOverride); }}
                className="btn-primary px-6"
              >
                {upsertOverrideMutation.isPending ? "Création..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
