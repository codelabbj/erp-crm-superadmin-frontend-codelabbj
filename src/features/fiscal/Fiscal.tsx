import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, Plus, FileText, Settings, ShieldCheck, AlertTriangle } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { normalizeList } from "../../lib/ui";

export function Fiscal() {
  const { data: configsData, isLoading } = useQuery({
    queryKey: ["fiscal-configs"],
    queryFn: () => adminApi.fiscalConfigs(),
  });

  const configs = useMemo(() => normalizeList<any>(configsData), [configsData]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuration Fiscale</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les paramètres de taxation et la conformité fiscale globale.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
          <Plus size={18} />
          Nouvelle config
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Settings size={18} className="text-slate-400" /> Paramètres Actifs
          </h3>
          <div className="grid gap-3">
            {isLoading ? (
              <p className="py-4 text-center text-slate-400">Chargement...</p>
            ) : configs.length === 0 ? (
              <p className="py-4 text-center text-slate-400">Aucune configuration fiscale définie.</p>
            ) : (
              configs.map((config: any) => (
                <div key={config.id} className="flex items-center justify-between rounded-xl border border-slate-50 p-4 dark:border-slate-800/50">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{config.name || "Config Standard"}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Régime: {config.regime || "TVA Standard"}</p>
                  </div>
                  <ShieldCheck size={20} className="text-emerald-500" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <FileText size={18} className="text-slate-400" /> Rapports Fiscaux
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Générez des rapports de synthèse pour les déclarations de TVA et autres taxes.</p>
            <button className="w-full rounded-xl border border-brand-purple-200 py-2.5 text-xs font-bold text-brand-purple-600 transition hover:bg-brand-purple-50 dark:border-brand-purple-900/30 dark:text-brand-purple-400 dark:hover:bg-brand-purple-900/10">
              Générer Rapport Annuel
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600" size={20} />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-400">Conformité</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
                  Toutes les transactions sur la plateforme sont auditées pour assurer la conformité avec les réglementations locales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
