import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { adminApi, type AdminDomain } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function Domains() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newDomain, setNewDomain] = useState({ tenant_id: "", domain: "", cname_target: "" });
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-domains", q],
    queryFn: () => adminApi.domains({ q }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { tenant_id: string; domain: string; cname_target: string }) => 
      adminApi.createDomain(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
      setIsModalOpen(false);
      setModalError("");
      setNewDomain({ tenant_id: "", domain: "", cname_target: "" });
    },
    onError: (e: unknown) => setModalError(getErrorMessage(e)),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.verifyDomain(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-domains"] }),
    onSettled: () => close(),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => adminApi.renewDomainCertificate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-domains"] }),
    onSettled: () => close(),
  });

  const isMutating = verifyMutation.isPending || renewMutation.isPending;

  const domains = data?.results || [];

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Domaines & SSL</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les domaines personnalisés et les certificats SSL des tenants.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          Nouveau domaine
        </button>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher un domaine ou un tenant..."
          className="flex-1 bg-transparent text-sm outline-none dark:text-slate-200"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Domaine</th>
              <th className="px-6 py-4">Tenant</th>
              <th className="px-6 py-4">Status DNS</th>
              <th className="px-6 py-4">SSL</th>
              <th className="px-6 py-4">Expiration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Chargement...</td>
              </tr>
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Aucun domaine trouvé.</td>
              </tr>
            ) : (
              domains.map((domain) => (
                <tr key={domain.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                      <Globe size={16} className="text-brand-purple-500" />
                      {domain.domain}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{domain.tenant_name}</td>
                  <td className="px-6 py-4">
                    {domain.dns_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertCircle size={12} /> En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <SSLStatusBadge status={domain.certificate_status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {domain.certificate_expires_at ? new Date(domain.certificate_expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!domain.dns_verified && (
                        <button
                          onClick={() =>
                            ask({
                              description: `Lancer la vérification DNS pour « ${domain.domain} » ?`,
                              confirmText: "Vérifier",
                              action: () => verifyMutation.mutate(domain.id),
                            })
                          }
                          className="btn-ghost h-9 w-9 p-0 text-slate-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                          title="Vérifier DNS"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          ask({
                            description: `Renouveler le certificat SSL pour « ${domain.domain} » ?`,
                            confirmText: "Renouveler",
                            action: () => renewMutation.mutate(domain.id),
                          })
                        }
                        className="btn-ghost h-9 w-9 p-0 text-slate-400 hover:text-brand-purple-600 dark:hover:bg-brand-purple-900/20"
                        title="Renouveler SSL"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouveau Domaine</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase">ID du Tenant</label>
                <input 
                  value={newDomain.tenant_id}
                  onChange={(e) => setNewDomain({ ...newDomain, tenant_id: e.target.value })}
                  placeholder="ex: 123e4567-e89b..."
                  className="w-full"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Domaine</label>
                <input 
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  placeholder="ex: erp.client.com"
                  className="w-full"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Cible CNAME</label>
                <input 
                  value={newDomain.cname_target}
                  onChange={(e) => setNewDomain({ ...newDomain, cname_target: e.target.value })}
                  placeholder="ex: ingress.codelab.bj"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button 
                disabled={createMutation.isPending}
                onClick={() => { setModalError(""); createMutation.mutate(newDomain); }}
                className="btn-primary px-6"
              >
                {createMutation.isPending ? "Création..." : "Créer le domaine"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDialog(isMutating)}
    </div>
  );
}

function SSLStatusBadge({ status }: { status: AdminDomain["certificate_status"] }) {
  switch (status) {
    case "valid":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Valide
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          En cours
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          Expiré
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
          Erreur
        </span>
      );
    default:
      return null;
  }
}
