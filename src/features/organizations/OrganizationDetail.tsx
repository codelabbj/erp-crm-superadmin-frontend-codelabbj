import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, Building2, Users, History, Mail, ShieldAlert, 
  UserPlus, Clock, CheckCircle2, Plus, RefreshCw, Zap, Globe, Settings2, ChevronRight
} from "lucide-react";
import { adminApi, type AssignPlanPayload } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";
import { formatMoneyFromApi } from "@/lib/money";

type OrganizationDetailProps = {
  orgId: string;
  onBack: () => void;
};

export function OrganizationDetail({ orgId, onBack }: OrganizationDetailProps) {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: relatedData, isLoading: isRelatedLoading } = useQuery({
    queryKey: ["org-related", orgId],
    queryFn: () => adminApi.organizationRelatedData(orgId),
  });

  const { data: subs, isLoading: isSubsLoading } = useQuery({
    queryKey: ["org-subs", orgId],
    queryFn: () => adminApi.organizationSubscriptions(orgId),
  });

  const { data: plans } = useQuery({
    queryKey: ["licensing-plans"],
    queryFn: () => adminApi.licensingPlans(),
  });

  const assignPlanMutation = useMutation({
    mutationFn: (payload: AssignPlanPayload) => adminApi.assignPlanToOrganization(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-related", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-subs", orgId] });
      setIsPlanModalOpen(false);
    },
  });

  const users = relatedData?.data?.users || [];
  const totals = relatedData?.data?.totals;

  const mut = useMutation({
    mutationFn: adminApi.updateOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-related", orgId] });
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
    },
  });

  if (isRelatedLoading || isSubsLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-brand-purple-600" size={32} />
        <p className="text-sm font-medium text-slate-500">Chargement de l&apos;organisation...</p>
      </div>
    );
  }

  const org = relatedData?.data?.organization;
  if (!org) return <div className="py-12 text-center text-rose-500 font-bold">Organisation introuvable.</div>;

  return (
    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-wrap items-center gap-4">
        <button
          onClick={onBack}
          className="btn-secondary h-10 w-10 p-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-gradient-to-tr from-brand-purple-600 to-brand-magenta-500 p-0.5 shadow-lg shadow-brand-purple-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[calc(1.5rem-2px)] bg-white dark:bg-slate-900">
              <Building2 size={24} className="text-brand-purple-600" />
            </div>
          </div>
          <div>
            <h2 className="m-0 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{org.name}</h2>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Globe size={14} /> {org.slug}.codelab.bj • <Clock size={14} /> Créée le {formatIsoDate(org.created_at)}
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <button
            onClick={() => mut.mutate({ id: org.id, is_active: !org.is_active })}
            className={`btn-secondary flex items-center gap-2 px-5 py-2.5 ${
              org.is_active 
                ? "text-amber-600 hover:text-amber-700 dark:text-amber-400" 
                : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {org.is_active ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
            {org.is_active ? "Suspendre" : "Réactiver"}
          </button>
          <button className="btn-primary px-5 py-2.5 shadow-brand-purple-500/20">
            <Mail size={18} />
            Email Admin
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-3xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Settings2 size={14} /> Informations Core
            </h3>
            <div className="space-y-4">
              <InfoItem label="Pays" value={org.country} />
              <InfoItem label="Devise" value={org.currency} />
              <InfoItem label="Statut" value={org.is_active ? "Actif" : "Suspendu"} status={org.is_active ? "ok" : "error"} />
              <div className="my-6 border-t border-slate-50 dark:border-slate-800" />
              <InfoItem label="Total Clients" value={totals?.customers || 0} />
              <InfoItem label="Total Produits" value={totals?.products || 0} />
              <InfoItem label="Total Commandes" value={totals?.orders || 0} />
              <InfoItem label="Collaborateurs" value={`${users.length} actifs`} />
            </div>
          </section>

          <section className="rounded-3xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Zap size={14} className="text-brand-purple-600" /> Licensing
              </h3>
              <button 
                onClick={() => setIsPlanModalOpen(true)}
                className="btn-ghost h-8 w-8 p-0 text-brand-purple-600 dark:text-brand-magenta-500"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {subs?.results?.map((sub) => (
                <div key={sub.id} className="group flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-brand-purple-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-brand-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{sub.module.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sub.status}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-purple-500" />
                </div>
              ))}
              {!subs?.results?.length && (
                <div className="py-6 text-center">
                  <p className="text-xs font-medium text-slate-400 italic">Aucun abonnement actif.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-3xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Users size={14} /> Collaborateurs ({users.length})
              </h3>
              <button className="btn-secondary px-4 py-2 text-xs">
                <UserPlus size={14} /> Inviter
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/30">
                    <th className="px-8 py-4 text-left font-black">Utilisateur</th>
                    <th className="px-8 py-4 text-left font-black">Rôle</th>
                    <th className="px-8 py-4 text-left font-black">Statut</th>
                    <th className="px-8 py-4 text-right font-black">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 text-xs font-black text-slate-500 dark:from-slate-800 dark:to-slate-700">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                            <p className="text-[11px] font-medium text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {user.is_superuser ? "Super Admin" : user.is_staff ? "Staff" : "Membre"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{user.is_active ? "Actif" : "Bloqué"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="btn-ghost px-2 py-1 text-[10px] font-black text-slate-400 hover:text-brand-purple-600 dark:hover:text-brand-magenta-500">MODIFIER</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <History size={14} /> Transactions Récentes
              </h3>
            </div>
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-200 dark:bg-slate-800">
                <History size={32} />
              </div>
              <p className="text-sm font-medium text-slate-400">Aucun historique disponible pour ce tenant.</p>
            </div>
          </section>
        </div>
      </div>

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Assigner un Plan</h3>
                <p className="text-sm text-slate-500">Choisissez une offre commerciale pour {org.name}.</p>
              </div>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="btn-ghost h-10 w-10 p-0 text-slate-400 hover:text-rose-600"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="grid gap-4">
              {plans?.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => assignPlanMutation.mutate({ plan_id: plan.id })}
                  disabled={assignPlanMutation.isPending}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 text-left transition hover:border-brand-purple-400 hover:bg-brand-purple-50/50"
                >
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">{plan.name}</h4>
                    <p className="text-xs font-medium text-slate-500">{plan.description || `Inclus ${plan.limits.included_seats} sièges.`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-purple-600">{formatMoneyFromApi(plan.price_monthly)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">/ mois</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="btn-secondary px-8 py-3"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, status }: { label: string; value: string | number; status?: "ok" | "error" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {status && <div className={`h-2 w-2 rounded-full ${status === "ok" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"}`} />}
        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{value}</span>
      </div>
    </div>
  );
}
