import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Plus, Clock, AlertTriangle, Shield, Settings2, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue, usePaginationState } from "@/hooks/useListState";
import { clientPageSlice } from "@/lib/pagination";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

export function Security() {
  const [activeTab, setActiveTab] = useState<"banned" | "waf">("banned");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const bannedPagination = usePaginationState(20);
  const wafPagination = usePaginationState(9);
  const queryClient = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();

  const { data: bannedIps, isLoading: isBannedLoading } = useQuery({
    queryKey: ["admin-banned-ips"],
    queryFn: () => adminApi.bannedIps(),
  });

  const { data: wafRules, isLoading: isWafLoading } = useQuery({
    queryKey: ["admin-waf-rules"],
    queryFn: () => adminApi.wafRules(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newBan, setNewBan] = useState({ ip_address: "", reason: "", expires_at: "", is_active: true });

  const banMutation = useMutation({
    mutationFn: (payload: { ip_address: string; reason: string; expires_at: string; is_active: boolean }) => 
      adminApi.banIp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banned-ips"] });
      setIsModalOpen(false);
      setModalError("");
      setNewBan({ ip_address: "", reason: "", expires_at: "", is_active: true });
    },
    onError: (e: unknown) => setModalError(getErrorMessage(e)),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanIp(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banned-ips"] }),
    onSettled: () => close(),
  });

  const patchWafMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.patchWafRule(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-waf-rules"] }),
    onSettled: () => close(),
  });

  const isMutating = unbanMutation.isPending || patchWafMutation.isPending;

  const filteredBanned = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = bannedIps ?? [];
    if (!q) return list;
    return list.filter(
      (ip) =>
        ip.ip_address.toLowerCase().includes(q) ||
        (ip.reason ?? "").toLowerCase().includes(q),
    );
  }, [bannedIps, debouncedSearch]);

  const { items: pagedBanned, total: bannedTotal } = useMemo(
    () => clientPageSlice(filteredBanned, bannedPagination.page, bannedPagination.pageSize),
    [filteredBanned, bannedPagination.page, bannedPagination.pageSize],
  );

  const filteredWaf = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = wafRules ?? [];
    if (!q) return list;
    return list.filter(
      (rule) =>
        rule.key.toLowerCase().includes(q) ||
        (rule.description ?? "").toLowerCase().includes(q),
    );
  }, [wafRules, debouncedSearch]);

  const { items: pagedWaf, total: wafTotal } = useMemo(
    () => clientPageSlice(filteredWaf, wafPagination.page, wafPagination.pageSize),
    [filteredWaf, wafPagination.page, wafPagination.pageSize],
  );

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sécurité & Conformité</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez le pare-feu applicatif et les restrictions d&apos;accès IP.</p>
        </div>
      </header>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit">
        <button
          onClick={() => setActiveTab("banned")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "banned"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          IPs Bannies
        </button>
        <button
          onClick={() => setActiveTab("waf")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "waf"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Règles WAF
        </button>
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            bannedPagination.resetPage();
            wafPagination.resetPage();
          }}
          placeholder={activeTab === "banned" ? "IP ou raison…" : "Clé ou description WAF…"}
        />
      </FilterBar>

      {activeTab === "banned" ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Restrictions IP actives</h3>
            {/* DISABLED: Bannir une IP
            <button onClick={() => setIsModalOpen(true)} className="btn-danger px-3 py-1.5 text-xs">
              <Plus size={14} /> Bannir une IP
            </button>
            */}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Adresse IP</th>
                  <th className="px-6 py-4">Raison</th>
                  <th className="px-6 py-4">Expiration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft dark:divide-slate-800">
                {isBannedLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                ) : pagedBanned.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucune IP bannie actuellement.</td></tr>
                ) : pagedBanned.map((ip) => (
                  <tr key={ip.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-100">{ip.ip_address}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{ip.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock size={12} /> {new Date(ip.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ip.is_active ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Actif</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">Inactif</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button
                        onClick={() =>
                          ask({
                            description: `Débannir l'adresse IP ${ip.ip_address} ?`,
                            confirmText: "Débannir",
                            action: () => unbanMutation.mutate(ip.id),
                          })
                        }
                        className="btn-ghost h-9 w-9 p-0 text-slate-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                        title="Débannir"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={bannedPagination.page}
            pageSize={bannedPagination.pageSize}
            total={bannedTotal}
            onPageChange={bannedPagination.setPage}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isWafLoading ? (
              <p className="col-span-full py-12 text-center text-slate-400">Chargement des règles...</p>
            ) : pagedWaf.length === 0 ? (
              <p className="col-span-full py-12 text-center text-slate-400">Aucune règle trouvée.</p>
            ) : pagedWaf.map((rule) => (
              <div key={rule.id} className="group relative overflow-hidden rounded-2xl border border-border-soft bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                    <Shield className={rule.is_enabled ? "text-emerald-500" : "text-slate-400"} size={20} />
                  </div>
                  <button
                    onClick={() =>
                      ask({
                        description: rule.is_enabled
                          ? `Désactiver la règle WAF « ${rule.key} » ?`
                          : `Activer la règle WAF « ${rule.key} » ?`,
                        danger: rule.is_enabled,
                        confirmText: rule.is_enabled ? "Désactiver" : "Activer",
                        action: () =>
                          patchWafMutation.mutate({ id: rule.id, payload: { is_enabled: !rule.is_enabled } }),
                      })
                    }
                    className="text-slate-400 transition hover:text-brand-purple-600"
                  >
                    {rule.is_enabled ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                <h4 className="mb-1 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{rule.key}</h4>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rule.description}</p>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <Settings2 size={12} />
                    {JSON.stringify(rule.config)}
                  </div>
                  <button className="btn-ghost px-2 py-1 text-[10px] text-brand-purple-600 dark:text-brand-magenta-500">
                    Éditer
                  </button>
                </div>
                {!rule.is_enabled && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] dark:bg-slate-950/40" />
                )}
              </div>
            ))}
          </div>
          <Pagination
            page={wafPagination.page}
            pageSize={wafPagination.pageSize}
            total={wafTotal}
            onPageChange={wafPagination.setPage}
          />
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600" size={18} />
              <div className="grid gap-1">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-400">Attention</p>
                <p className="text-xs text-amber-700 dark:text-amber-500/80">
                  Les modifications des règles WAF impactent l&apos;ensemble de la plateforme en temps réel. Soyez vigilant lors des changements de configuration (block vs sanitize).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Bannir une IP</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase">Adresse IP</label>
                <input 
                  value={newBan.ip_address}
                  onChange={(e) => setNewBan({ ...newBan, ip_address: e.target.value })}
                  placeholder="ex: 192.168.1.1"
                  className="w-full"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Raison</label>
                <textarea 
                  value={newBan.reason}
                  onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                  placeholder="ex: Tentatives de brute force répétées"
                  className="w-full"
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Date d'expiration</label>
                <input 
                  type="date"
                  value={newBan.expires_at}
                  onChange={(e) => setNewBan({ ...newBan, expires_at: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Annuler</button>
              <button 
                disabled={banMutation.isPending || !newBan.ip_address}
                onClick={() => { setModalError(""); banMutation.mutate(newBan); }}
                className="btn-danger px-6"
              >
                {banMutation.isPending ? "Bannissement..." : "Bannir l'IP"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDialog(isMutating)}
    </div>
  );
}
