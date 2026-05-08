import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { adminApi, type SupportTicket } from "../../lib/adminApi";
import { formatIsoDate, normalizeList } from "../../lib/ui";

export function Support() {
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => adminApi.supportTickets(),
  });

  const tickets = useMemo(() => normalizeList<SupportTicket>(ticketsData), [ticketsData]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Support & Tickets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes d&apos;assistance des organisations.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
          <Plus size={18} />
          Nouveau ticket
        </button>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <FilterBadge label="Tous les tickets" count={tickets.length} active />
        <FilterBadge label="Ouverts" count={2} />
        <FilterBadge label="En attente" count={0} />
        <FilterBadge label="Résolus" count={5} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Sujet</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priorité</th>
              <th className="px-6 py-4">Créé le</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chargement des tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Aucun ticket trouvé.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{ticket.subject}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MessageSquare size={10} /> 0 commentaires
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {formatIsoDate(ticket.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand-purple-600 hover:underline dark:text-brand-purple-400">Gérer</button>
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

function FilterBadge({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <button className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition ${
      active 
        ? "border-brand-purple-600 bg-brand-purple-600 text-white shadow-md shadow-brand-purple-500/20" 
        : "border-border-soft bg-white text-slate-500 hover:border-brand-purple-300 hover:text-brand-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    }`}>
      {label} {count !== undefined && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{count}</span>}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "closed" 
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  const icon = status === "closed" ? <CheckCircle2 size={12} /> : <Clock size={12} />;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style}`}>
      {icon} {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const style = priority === "high" || priority === "urgent"
    ? "text-rose-600"
    : "text-slate-500";
  
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${style}`}>
      <AlertCircle size={12} /> {priority}
    </span>
  );
}
