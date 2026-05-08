import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus, Mail, Users, Calendar, ArrowRight } from "lucide-react";
import { adminApi, type MarketingCampaign } from "../../lib/adminApi";
import { formatIsoDate, normalizeList } from "../../lib/ui";

export function Marketing() {
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["marketing-campaigns"],
    queryFn: () => adminApi.marketingCampaigns(),
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
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
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
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowRight size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
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
