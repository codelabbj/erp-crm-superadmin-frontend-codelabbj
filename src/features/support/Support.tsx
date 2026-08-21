import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, X, Tag, Calendar } from "lucide-react";
import { adminApi, type SupportTicket } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage, normalizeList } from "../../lib/ui";
import { FilterBar, FilterButton, FilterSelect, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { clientPageSlice } from "@/lib/pagination";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function Support() {
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => adminApi.supportTickets(),
  });

  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", priority: "medium", status: "open" });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { page, setPage, pageSize, resetPage } = usePaginationState(20);
  const [managingTicket, setManagingTicket] = useState<SupportTicket | null>(null);
  const [manageForm, setManageForm] = useState({ status: "", priority: "" });
  const [manageError, setManageError] = useState("");
  const { ask, close, renderDialog } = useConfirmDialog();

  const createMut = useMutation({
    mutationFn: adminApi.createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setIsModalOpen(false);
      setModalError("");
      setNewTicket({ title: "", priority: "medium", status: "open" });
    },
    onError: (e) => setModalError(getErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; priority: string } }) =>
      adminApi.updateSupportTicket(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setManagingTicket(null);
      setManageError("");
    },
    onError: (e) => setManageError(getErrorMessage(e)),
    onSettled: () => close(),
  });

  const openManage = (ticket: SupportTicket) => {
    setManagingTicket(ticket);
    setManageForm({ status: ticket.status, priority: ticket.priority });
    setManageError("");
  };

  const tickets = useMemo(() => normalizeList<SupportTicket>(ticketsData), [ticketsData]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tickets.length };
    for (const t of tickets) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (!q) return true;
      const subject = String(t.subject || t.title || "").toLowerCase();
      return subject.includes(q) || t.id.toLowerCase().includes(q);
    });
  }, [tickets, debouncedSearch, statusFilter, priorityFilter]);

  const { items: pagedTickets, total } = useMemo(
    () => clientPageSlice(filteredTickets, page, pageSize),
    [filteredTickets, page, pageSize],
  );

  return (
    <ListPageShell>
      <PageHeader
        title="Support & Tickets"
        description="Gérez les demandes d'assistance des organisations."
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={18} />
            Nouveau ticket
          </button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Sujet, référence…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            resetPage();
          }}
          placeholder="Tous les statuts"
          options={[
            { value: "open", label: "Ouvert" },
            { value: "pending", label: "En attente" },
            { value: "in_progress", label: "En cours" },
            { value: "resolved", label: "Résolu" },
            { value: "closed", label: "Fermé" },
          ]}
        />
        <FilterSelect
          value={priorityFilter}
          onChange={(v) => {
            setPriorityFilter(v);
            resetPage();
          }}
          placeholder="Toutes priorités"
          options={[
            { value: "low", label: "Faible" },
            { value: "medium", label: "Moyenne" },
            { value: "high", label: "Haute" },
            { value: "urgent", label: "Urgent" },
          ]}
        />
      </FilterBar>

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={!statusFilter} onClick={() => { setStatusFilter(""); resetPage(); }}>
          Tous ({statusCounts.all})
        </FilterButton>
        <FilterButton active={statusFilter === "open"} onClick={() => { setStatusFilter("open"); resetPage(); }}>
          Ouverts ({statusCounts.open ?? 0})
        </FilterButton>
        <FilterButton active={statusFilter === "pending"} onClick={() => { setStatusFilter("pending"); resetPage(); }}>
          En attente ({statusCounts.pending ?? 0})
        </FilterButton>
        <FilterButton active={statusFilter === "resolved" || statusFilter === "closed"} onClick={() => { setStatusFilter("resolved"); resetPage(); }}>
          Résolus ({(statusCounts.resolved ?? 0) + (statusCounts.closed ?? 0)})
        </FilterButton>
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
            ) : pagedTickets.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Aucun ticket trouvé.</td></tr>
            ) : (
              pagedTickets.map((ticket) => (
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
                    <button
                      onClick={() => openManage(ticket)}
                      className="btn-ghost px-2 py-1 text-xs font-bold text-brand-purple-600 dark:text-brand-magenta-500"
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Nouveau Ticket</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase">Titre</label>
                <input 
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="ex: Problème d'accès au module CRM"
                  className="w-full"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Priorité</label>
                <select 
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button 
                disabled={createMut.isPending || !newTicket.title}
                onClick={() => { setModalError(""); createMut.mutate(newTicket); }}
                className="btn-primary px-6"
              >
                {createMut.isPending ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {managingTicket && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="grid gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ticket #{managingTicket.id.slice(0, 8)}</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {(managingTicket.subject || managingTicket.title || "Sans titre") as string}
                </h3>
              </div>
              <button onClick={() => setManagingTicket(null)} className="btn-ghost h-9 w-9 shrink-0 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar size={13} />
                <span>Créé {formatIsoDate(managingTicket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Tag size={13} />
                <StatusBadge status={managingTicket.status} />
                <PriorityBadge priority={managingTicket.priority} />
              </div>
            </div>

            {/* Edit form */}
            <div className="space-y-4 p-6">
              {manageError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                  {manageError}
                </div>
              )}
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                <select
                  value={manageForm.status}
                  onChange={(e) => setManageForm({ ...manageForm, status: e.target.value })}
                  className="w-full"
                >
                  <option value="open">Ouvert</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Priorité</label>
                <select
                  value={manageForm.priority}
                  onChange={(e) => setManageForm({ ...manageForm, priority: e.target.value })}
                  className="w-full"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button onClick={() => setManagingTicket(null)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={updateMut.isPending}
                onClick={() => {
                  if (!managingTicket) return;
                  setManageError("");
                  ask({
                    description: `Enregistrer les modifications du ticket « ${managingTicket.title} » ?`,
                    confirmText: "Enregistrer",
                    action: () =>
                      updateMut.mutate({ id: managingTicket.id, payload: manageForm }),
                  });
                }}
                className="btn-primary px-6"
              >
                {updateMut.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDialog(updateMut.isPending)}
    </ListPageShell>
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
