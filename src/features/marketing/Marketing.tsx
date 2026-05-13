import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Mail, Users, Calendar, ArrowRight } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage, normalizeList } from "../../lib/ui";

export function Marketing() {
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: () => adminApi.marketingCampaigns(),
  });

  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newCampaign, setNewCampaign] = useState({ name: "", status: "draft" });

  const createMut = useMutation({
    mutationFn: adminApi.createMarketingCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
      setIsModalOpen(false);
      setModalError("");
      setNewCampaign({ name: "", status: "draft" });
    },
    onError: (e: unknown) => setModalError(getErrorMessage(e)),
  });

  const campaigns = useMemo(() => normalizeList<any>(campaignsData), [campaignsData]);

  const activeCount = useMemo(() => campaigns.filter((c) => c.status === "active" || c.status === "en_cours").length, [campaigns]);
  const totalRecipients = useMemo(() => campaigns.reduce((sum, c) => sum + (Number(c.recipients_count) || 0), 0), [campaigns]);
  const avgOpenRate = useMemo(() => {
    const withRate = campaigns.filter((c) => c.open_rate !== undefined && c.open_rate !== null);
    if (withRate.length === 0) return null;
    return (withRate.reduce((sum, c) => sum + Number(c.open_rate), 0) / withRate.length).toFixed(1);
  }, [campaigns]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Marketing & Campagnes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les communications globales et les campagnes de fidélisation.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={18} />
          Nouvelle campagne
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Campagnes Actives" value={activeCount} icon={<Megaphone size={20} />} />
        <StatCard title="Destinataires" value={totalRecipients > 0 ? totalRecipients.toLocaleString() : "—"} icon={<Users size={20} />} />
        <StatCard title="Taux d'ouverture" value={avgOpenRate ? `${avgOpenRate}%` : "—"} icon={<Mail size={20} />} />
      </div>

      <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-border-soft p-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Campagnes récentes</h3>
        </div>
        <div className="divide-y divide-border-soft dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Chargement...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Aucune campagne trouvée.</div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-brand-purple-50 p-3 dark:bg-brand-purple-900/20">
                    <Megaphone size={20} className="text-brand-purple-600 dark:text-brand-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{campaign.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatIsoDate(campaign.created_at)}</span>
                      <span className="flex items-center gap-1 uppercase font-bold tracking-tighter text-brand-magenta-600 dark:text-brand-magenta-500">{campaign.status}</span>
                    </div>
                  </div>
                </div>
                <button className="btn-ghost h-10 w-10 p-0">
                  <ArrowRight size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouvelle Campagne</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost h-9 w-9 p-0 text-slate-400">
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
                <label className="text-xs font-bold text-slate-500 uppercase">Nom de la campagne</label>
                <input 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="ex: Campagne Fidélité 2024"
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button 
                disabled={createMut.isPending || !newCampaign.name}
                onClick={() => { setModalError(""); createMut.mutate(newCampaign); }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {icon} {title}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
