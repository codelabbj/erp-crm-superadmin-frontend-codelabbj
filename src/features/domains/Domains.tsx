import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { adminApi, type AdminDomain } from "../../lib/adminApi";

export function Domains() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-domains", q],
    queryFn: () => adminApi.domains({ q }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.verifyDomain(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-domains"] }),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => adminApi.renewDomainCertificate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-domains"] }),
  });

  const domains = data?.results || [];

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Domaines & SSL</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les domaines personnalisés et les certificats SSL des tenants.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
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
                          onClick={() => verifyMutation.mutate(domain.id)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                          title="Vérifier DNS"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => renewMutation.mutate(domain.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-purple-50 hover:text-brand-purple-600 dark:hover:bg-brand-purple-900/20"
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
