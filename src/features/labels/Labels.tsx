import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag, Plus, Printer, Layout, Database, FileCode,
  CheckCircle2, X, QrCode, Barcode, Loader2,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { getErrorMessage, normalizeList } from "../../lib/ui";

const DIMENSIONS = ["80x40mm", "100x50mm", "60x30mm", "105x148mm (A6)", "148x210mm (A5)"];
const FORMATS = ["EAN13", "CODE128", "QR_CODE", "DATAMATRIX", "PDF417", "UPC_A"];

export function Labels() {
  const queryClient = useQueryClient();

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => adminApi.labelTemplates(),
  });
  const templates = useMemo(() => normalizeList<any>(templatesData), [templatesData]);

  // ── New template modal ──
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newError, setNewError] = useState("");
  const [newTemplate, setNewTemplate] = useState({ name: "", dimensions: "80x40mm", format: "CODE128", content: "" });

  const createMut = useMutation({
    mutationFn: adminApi.createLabelTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-templates"] });
      setIsNewOpen(false);
      setNewError("");
      setNewTemplate({ name: "", dimensions: "80x40mm", format: "CODE128", content: "" });
    },
    onError: (e: unknown) => setNewError(getErrorMessage(e)),
  });

  // ── Print / Impression modal ──
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printSuccess, setPrintSuccess] = useState("");
  const [printForm, setPrintForm] = useState({ template_id: "", copies: 1, data: "{}" });

  const printMut = useMutation({
    mutationFn: (payload: { template_id: string; data: Record<string, string>; copies: number }) =>
      adminApi.printLabel(payload),
    onSuccess: (res: any) => {
      setPrintSuccess(res?.message ?? "Job d'impression envoyé avec succès.");
      setPrintError("");
    },
    onError: (e: unknown) => { setPrintError(getErrorMessage(e)); setPrintSuccess(""); },
  });

  const submitPrint = () => {
    setPrintError(""); setPrintSuccess("");
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(printForm.data); } catch {
      setPrintError("Le champ Données doit être un JSON valide. ex: {\"ref\": \"ABC123\"}");
      return;
    }
    printMut.mutate({ template_id: printForm.template_id, data: parsed, copies: printForm.copies });
  };

  // ── Barcode generator modal ──
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeSuccess, setBarcodeSuccess] = useState("");
  const [barcodeForm, setBarcodeForm] = useState({ format: "CODE128", value: "", label: "" });

  const barcodeMut = useMutation({
    mutationFn: adminApi.generateLabel,
    onSuccess: (res: any) => {
      setBarcodeSuccess(res?.message ?? "Code-barres généré avec succès.");
      setBarcodeError("");
    },
    onError: (e: unknown) => { setBarcodeError(getErrorMessage(e)); setBarcodeSuccess(""); },
  });

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Étiquettes &amp; Barcodes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les modèles d&apos;étiquettes et les jobs d&apos;impression globaux.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIsPrintOpen(true); setPrintSuccess(""); setPrintError(""); }} className="btn-secondary">
            <Printer size={18} /> Impression
          </button>
          <button onClick={() => setIsNewOpen(true)} className="btn-primary">
            <Plus size={18} /> Nouveau Modèle
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Templates grid ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Layout size={18} className="text-slate-400" /> Modèles Enregistrés
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {isTemplatesLoading ? (
                <p className="col-span-full py-8 text-center text-slate-400">Chargement...</p>
              ) : templates.length === 0 ? (
                <p className="col-span-full py-8 text-center text-slate-400">Aucun modèle créé.</p>
              ) : (
                templates.map((template: any) => (
                  <div
                    key={template.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-100 p-4 transition hover:border-brand-purple-200 dark:border-slate-800/50 dark:hover:border-slate-700"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                        <Tag size={16} className="text-brand-purple-500" />
                      </div>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{template.name}</h4>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{template.dimensions || "80x40mm"}</span>
                      {template.format && <span className="rounded bg-slate-100 px-1 font-mono dark:bg-slate-800">{template.format}</span>}
                    </div>
                    <button
                      onClick={() => {
                        setIsPrintOpen(true);
                        setPrintForm((f) => ({ ...f, template_id: template.id }));
                        setPrintSuccess(""); setPrintError("");
                      }}
                      className="btn-ghost mt-3 w-full py-1 text-[10px] font-bold text-brand-purple-600 dark:text-brand-magenta-500"
                    >
                      <Printer size={12} /> Imprimer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Tools sidebar ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <FileCode size={18} className="text-slate-400" /> Générateur
            </h3>
            <div className="space-y-3">
              <ToolItem icon={<Database size={16} />} title="Import de données" />
              <ToolItem icon={<FileCode size={16} />} title="Format JSON/CSV" />
              <ToolItem icon={<Printer size={16} />} title="Preview impression" />
            </div>
            <button
              onClick={() => { setIsBarcodeOpen(true); setBarcodeSuccess(""); setBarcodeError(""); }}
              className="btn-primary mt-6 w-full py-2.5 text-xs"
            >
              <QrCode size={15} /> Générer Code-barres
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          NEW TEMPLATE MODAL
      ════════════════════════════════ */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouveau Modèle</h3>
              <button onClick={() => setIsNewOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400"><X size={20} /></button>
            </div>

            {newError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {newError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom *</label>
                <input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="ex: Étiquette Produit Standard"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dimensions</label>
                  <select
                    value={newTemplate.dimensions}
                    onChange={(e) => setNewTemplate({ ...newTemplate, dimensions: e.target.value })}
                    className="w-full"
                  >
                    {DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Format code</label>
                  <select
                    value={newTemplate.format}
                    onChange={(e) => setNewTemplate({ ...newTemplate, format: e.target.value })}
                    className="w-full"
                  >
                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Contenu / Template (optionnel)</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="ex: {{ref}} - {{product_name}}"
                  className="w-full font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsNewOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={createMut.isPending || !newTemplate.name.trim()}
                onClick={() => { setNewError(""); createMut.mutate(newTemplate); }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          PRINT MODAL
      ════════════════════════════════ */}
      {isPrintOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Lancer une Impression</h3>
              <button onClick={() => setIsPrintOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400"><X size={20} /></button>
            </div>

            {printError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {printError}
              </div>
            )}
            {printSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {printSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Modèle *</label>
                <select
                  value={printForm.template_id}
                  onChange={(e) => setPrintForm({ ...printForm, template_id: e.target.value })}
                  className="w-full"
                >
                  <option value="">— Sélectionner un modèle —</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Données (JSON)</label>
                <textarea
                  value={printForm.data}
                  onChange={(e) => setPrintForm({ ...printForm, data: e.target.value })}
                  placeholder={'{"ref": "ABC123", "name": "Produit X"}'}
                  className="w-full font-mono text-xs"
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre de copies</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={printForm.copies}
                  onChange={(e) => setPrintForm({ ...printForm, copies: parseInt(e.target.value) || 1 })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsPrintOpen(false)} className="btn-secondary px-6">Fermer</button>
              <button
                disabled={printMut.isPending || !printForm.template_id}
                onClick={submitPrint}
                className="btn-primary px-6"
              >
                {printMut.isPending
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Envoi...</span>
                  : <span className="flex items-center gap-2"><Printer size={14} />Imprimer</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          BARCODE GENERATOR MODAL
      ════════════════════════════════ */}
      {isBarcodeOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Générer Code-barres</h3>
              <button onClick={() => setIsBarcodeOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400"><X size={20} /></button>
            </div>

            {barcodeError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {barcodeError}
              </div>
            )}
            {barcodeSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {barcodeSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Format</label>
                <select
                  value={barcodeForm.format}
                  onChange={(e) => setBarcodeForm({ ...barcodeForm, format: e.target.value })}
                  className="w-full"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Valeur *</label>
                <input
                  value={barcodeForm.value}
                  onChange={(e) => setBarcodeForm({ ...barcodeForm, value: e.target.value })}
                  placeholder="ex: 1234567890123"
                  className="w-full font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Libellé (optionnel)</label>
                <input
                  value={barcodeForm.label}
                  onChange={(e) => setBarcodeForm({ ...barcodeForm, label: e.target.value })}
                  placeholder="ex: Référence produit"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsBarcodeOpen(false)} className="btn-secondary px-6">Fermer</button>
              <button
                disabled={barcodeMut.isPending || !barcodeForm.value.trim()}
                onClick={() => { setBarcodeError(""); setBarcodeSuccess(""); barcodeMut.mutate(barcodeForm); }}
                className="btn-primary px-6"
              >
                {barcodeMut.isPending
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Génération...</span>
                  : <span className="flex items-center gap-2"><Barcode size={14} />Générer</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-50 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800">
      <div className="text-slate-400">{icon}</div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{title}</span>
    </div>
  );
}
