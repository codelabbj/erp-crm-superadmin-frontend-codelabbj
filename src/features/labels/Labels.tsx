import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Plus, Printer, Layout, Database, FileCode, CheckCircle2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { normalizeList } from "../../lib/ui";

export function Labels() {
  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["label-templates"],
    queryFn: () => adminApi.labelTemplates(),
  });

  const templates = useMemo(() => normalizeList<any>(templatesData), [templatesData]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Étiquettes & Barcodes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les modèles d&apos;étiquettes et les jobs d&apos;impression globaux.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Printer size={18} /> Impression
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
            <Plus size={18} /> Nouveau Modèle
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates Section */}
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
                  <div key={template.id} className="group relative overflow-hidden rounded-xl border border-slate-50 p-4 transition hover:border-brand-purple-200 dark:border-slate-800/50 dark:hover:border-slate-800">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                        <Tag size={16} className="text-brand-purple-500" />
                      </div>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{template.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{template.dimensions || "80x40mm"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tools Sidebar */}
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
            <button className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-brand-purple-600 dark:hover:bg-brand-purple-700">
              Générer Code-barres
            </button>
          </div>
        </div>
      </div>
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
