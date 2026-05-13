import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Settings, ShieldCheck, AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { getErrorMessage, normalizeList } from "../../lib/ui";

const REGIMES = ["TVA Standard", "TVA Réduite", "Exonéré", "Micro-entreprise", "Forfait", "Réel Simplifié"];
const REPORT_TYPES = [
  { value: "annual_vat", label: "Déclaration TVA Annuelle" },
  { value: "quarterly_vat", label: "Déclaration TVA Trimestrielle" },
  { value: "income_summary", label: "Synthèse des Revenus" },
  { value: "full_audit", label: "Audit Complet" },
];

export function Fiscal() {
  const queryClient = useQueryClient();

  const { data: configsData, isLoading } = useQuery({
    queryKey: ["fiscal-configs"],
    queryFn: () => adminApi.fiscalConfigs(),
  });

  const configs = useMemo(() => normalizeList<any>(configsData), [configsData]);

  // ── Create config modal ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newConfig, setNewConfig] = useState({
    name: "",
    regime: "TVA Standard",
    tax_rate: 18,
    country: "",
    is_active: true,
  });

  const createMut = useMutation({
    mutationFn: adminApi.createFiscalConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-configs"] });
      setIsCreateOpen(false);
      setCreateError("");
      setNewConfig({ name: "", regime: "TVA Standard", tax_rate: 18, country: "", is_active: true });
    },
    onError: (e: unknown) => setCreateError(getErrorMessage(e)),
  });

  // ── Edit config ──
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<{ name: string; regime: string; tax_rate: number; is_active: boolean }>({
    name: "", regime: "", tax_rate: 0, is_active: true,
  });

  const openEdit = (cfg: any) => {
    setEditingConfig(cfg);
    setEditForm({ name: cfg.name ?? "", regime: cfg.regime ?? "", tax_rate: cfg.tax_rate ?? 0, is_active: cfg.is_active ?? true });
    setEditError("");
  };

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateFiscalConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-configs"] });
      setEditingConfig(null);
      setEditError("");
    },
    onError: (e: unknown) => setEditError(getErrorMessage(e)),
  });

  // ── Generate report modal ──
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportForm, setReportForm] = useState({ year: new Date().getFullYear(), type: "annual_vat" });

  const reportMut = useMutation({
    mutationFn: adminApi.generateFiscalReport,
    onSuccess: (data: any) => {
      setReportSuccess(data?.message ?? "Rapport généré avec succès.");
      setReportError("");
    },
    onError: (e: unknown) => { setReportError(getErrorMessage(e)); setReportSuccess(""); },
  });

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuration Fiscale</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les paramètres de taxation et la conformité fiscale globale.</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
          <Plus size={18} />
          Nouvelle config
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Active configs ── */}
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
                <div key={config.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800/50">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                      {config.name || "Config Standard"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Régime: <strong>{config.regime || "TVA Standard"}</strong></span>
                      {config.tax_rate !== undefined && (
                        <span>Taux: <strong>{config.tax_rate}%</strong></span>
                      )}
                      {config.country && <span>Pays: <strong>{config.country}</strong></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className={config.is_active !== false ? "text-emerald-500" : "text-slate-300"} />
                    <button
                      onClick={() => openEdit(config)}
                      className="btn-ghost px-2 py-1 text-[10px] font-bold text-brand-purple-600 dark:text-brand-magenta-500"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          {/* Reports card */}
          <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <FileText size={18} className="text-slate-400" /> Rapports Fiscaux
            </h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Générez des rapports de synthèse pour les déclarations de TVA et autres taxes.
            </p>
            <button
              onClick={() => { setIsReportOpen(true); setReportSuccess(""); setReportError(""); }}
              className="btn-secondary w-full py-2.5 text-xs"
            >
              Générer un Rapport
            </button>
          </div>

          {/* Compliance notice */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
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

      {/* ════════════════════════════════
          CREATE CONFIG MODAL
      ════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouvelle Configuration</h3>
              <button onClick={() => setIsCreateOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom *</label>
                <input
                  value={newConfig.name}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  placeholder="ex: TVA Bénin 18%"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Régime</label>
                  <select
                    value={newConfig.regime}
                    onChange={(e) => setNewConfig({ ...newConfig, regime: e.target.value })}
                    className="w-full"
                  >
                    {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Taux (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={newConfig.tax_rate}
                    onChange={(e) => setNewConfig({ ...newConfig, tax_rate: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Pays</label>
                <input
                  value={newConfig.country}
                  onChange={(e) => setNewConfig({ ...newConfig, country: e.target.value })}
                  placeholder="ex: BJ, SN, CI..."
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Activer immédiatement</span>
                <button
                  type="button"
                  onClick={() => setNewConfig({ ...newConfig, is_active: !newConfig.is_active })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${newConfig.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${newConfig.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={createMut.isPending || !newConfig.name.trim()}
                onClick={() => { setCreateError(""); createMut.mutate(newConfig); }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          EDIT CONFIG MODAL
      ════════════════════════════════ */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Modifier la Configuration</h3>
              <button onClick={() => setEditingConfig(null)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Régime</label>
                  <select
                    value={editForm.regime}
                    onChange={(e) => setEditForm({ ...editForm, regime: e.target.value })}
                    className="w-full"
                  >
                    {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Taux (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editForm.tax_rate}
                    onChange={(e) => setEditForm({ ...editForm, tax_rate: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Actif</span>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editForm.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editForm.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditingConfig(null)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={updateMut.isPending}
                onClick={() => { setEditError(""); updateMut.mutate({ id: editingConfig.id, payload: editForm }); }}
                className="btn-primary px-6"
              >
                {updateMut.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          GENERATE REPORT MODAL
      ════════════════════════════════ */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Générer un Rapport</h3>
              <button onClick={() => setIsReportOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {reportError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {reportError}
              </div>
            )}
            {reportSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {reportSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Type de rapport</label>
                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                  className="w-full"
                >
                  {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Année</label>
                <input
                  type="number"
                  min={2020}
                  max={new Date().getFullYear()}
                  value={reportForm.year}
                  onChange={(e) => setReportForm({ ...reportForm, year: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsReportOpen(false)} className="btn-secondary px-6">Fermer</button>
              <button
                disabled={reportMut.isPending}
                onClick={() => { setReportError(""); setReportSuccess(""); reportMut.mutate(reportForm); }}
                className="btn-primary px-6"
              >
                {reportMut.isPending
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Génération...</span>
                  : "Générer"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
