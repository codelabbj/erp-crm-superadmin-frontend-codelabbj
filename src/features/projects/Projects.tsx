import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, CheckSquare, Layers, Clock, ArrowUpRight, X } from "lucide-react";
import { adminApi, type ProjectItem } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage, normalizeList } from "../../lib/ui";

export function Projects() {
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => adminApi.projects(),
  });

  const projects = useMemo(() => normalizeList<ProjectItem>(projectsData), [projectsData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "", status: "active" });

  const createMut = useMutation({
    mutationFn: adminApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      setIsModalOpen(false);
      setModalError("");
      setNewProject({ name: "", description: "", status: "active" });
    },
    onError: (e: unknown) => setModalError(getErrorMessage(e)),
  });

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Projets Plateforme</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des projets d&apos;implémentation et des tâches internes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
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
                <button className="btn-ghost h-8 w-8 p-0 text-brand-purple-600 opacity-0 transition group-hover:opacity-100 dark:text-brand-magenta-500">
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouveau Projet</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom du projet *</label>
                <input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="ex: Migration ERP Client A"
                  className="w-full"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Décrivez le projet..."
                  className="w-full"
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                  className="w-full"
                >
                  <option value="active">Actif</option>
                  <option value="planning">Planification</option>
                  <option value="on_hold">En pause</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={createMut.isPending || !newProject.name.trim()}
                onClick={() => { setModalError(""); createMut.mutate(newProject); }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création..." : "Créer le projet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
