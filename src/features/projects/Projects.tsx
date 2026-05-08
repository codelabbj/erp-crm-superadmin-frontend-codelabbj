import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Plus, CheckSquare, Layers, Clock, ArrowUpRight } from "lucide-react";
import { adminApi, type ProjectItem } from "../../lib/adminApi";
import { formatIsoDate, normalizeList } from "../../lib/ui";

export function Projects() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => adminApi.projects(),
  });

  const projects = useMemo(() => normalizeList<ProjectItem>(projectsData), [projectsData]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Projets Plateforme</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des projets d&apos;implémentation et des tâches internes.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
          <Plus size={18} />
          Nouveau projet
        </button>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Chargement des projets...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">Aucun projet actif.</div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="group flex flex-col justify-between rounded-2xl border border-border-soft bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-xl bg-brand-purple-50 p-2 dark:bg-brand-purple-900/20">
                    <Briefcase size={20} className="text-brand-purple-600 dark:text-brand-purple-400" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {project.status}
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{project.name}</h3>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Créé le {formatIsoDate(project.created_at)}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tâches</p>
                    <div className="mt-0.5 flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <CheckSquare size={14} className="text-emerald-500" /> 0
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Étapes</p>
                    <div className="mt-0.5 flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <Layers size={14} className="text-blue-500" /> 0
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={12} /> Prochaine échéance: —
                </div>
                <button className="text-brand-purple-600 opacity-0 transition group-hover:opacity-100 dark:text-brand-purple-400">
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
