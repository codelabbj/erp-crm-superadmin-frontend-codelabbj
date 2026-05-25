import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, Store, CreditCard, ExternalLink,
  ArrowRight, X, BarChart3, Globe, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { adminApi, type EcommerceOrder } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage, normalizeList } from "../../lib/ui";

type Tab = "orders" | "storefronts" | "analytics";

function statusStyle(status: string) {
  switch (status?.toLowerCase()) {
    case "completed": case "paid": case "delivered":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "pending": case "processing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "cancelled": case "refunded":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
}

function statusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "completed": case "paid": case "delivered": return <CheckCircle2 size={11} />;
    case "pending": case "processing": return <Clock size={11} />;
    case "cancelled": case "refunded": return <AlertCircle size={11} />;
    default: return null;
  }
}

export function Ecommerce() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [showAll, setShowAll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderError, setOrderError] = useState("");

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["admin-ecommerce-orders"],
    queryFn: () => adminApi.ecommerceOrders(),
  });

  const { data: storefrontsData, isLoading: isStorefrontsLoading } = useQuery({
    queryKey: ["admin-ecommerce-storefronts"],
    queryFn: () => adminApi.ecommerceStorefronts(),
    enabled: activeTab === "storefronts",
  });

  const orders = useMemo(() => normalizeList<EcommerceOrder>(ordersData), [ordersData]);
  const storefronts = useMemo(() => normalizeList<any>(storefrontsData), [storefrontsData]);

  const displayedOrders = showAll ? orders : orders.slice(0, 5);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0).toFixed(2),
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => ["completed", "paid", "delivered"].includes(o.status?.toLowerCase())).length,
    [orders]
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => ["pending", "processing"].includes(o.status?.toLowerCase())).length,
    [orders]
  );

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateEcommerceOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ecommerce-orders"] });
      setSelectedOrder(null);
      setOrderError("");
    },
    onError: (e: unknown) => setOrderError(getErrorMessage(e)),
  });

  const openOrder = (order: EcommerceOrder) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setOrderError("");
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "Commandes", icon: <ShoppingCart size={15} /> },
    { key: "storefronts", label: "Storefronts", icon: <Store size={15} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={15} /> },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">E-commerce Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Surveillance des ventes en ligne et des vitrines storefront.</p>
        </div>
        {/* Tab switcher in header */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Commandes (Total)" value={orders.length} icon={<ShoppingCart className="text-blue-500" size={20} />} />
        <MetricCard title="Ventes Brutes" value={`${totalRevenue} €`} icon={<CreditCard className="text-emerald-500" size={20} />} />
        <MetricCard title="Complétées" value={completedCount} icon={<CheckCircle2 className="text-emerald-500" size={20} />} />
        <MetricCard title="En attente" value={pendingCount} icon={<Clock className="text-amber-500" size={20} />} />
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
        <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-border-soft p-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {showAll ? "Toutes les commandes" : "Dernières commandes"}
            </h3>
            {orders.length > 5 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="btn-ghost px-2 py-1 text-xs font-bold text-brand-purple-600 dark:text-brand-magenta-500"
              >
                {showAll ? "Réduire" : `Voir tout (${orders.length})`}
              </button>
            )}
          </div>
          <div className="divide-y divide-border-soft dark:divide-slate-800">
            {isOrdersLoading ? (
              <div className="p-8 text-center text-slate-400">Chargement des commandes...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucune commande récente.</div>
            ) : (
              displayedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                      <ShoppingCart size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">#{order.order_number}</h4>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(order.status)}`}>
                          {statusIcon(order.status)} {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatIsoDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{order.total} €</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                    </div>
                    <button
                      onClick={() => openOrder(order)}
                      className="btn-ghost h-10 w-10 p-0"
                      title="Gérer la commande"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── STOREFRONTS TAB ── */}
      {activeTab === "storefronts" && (
        <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-border-soft p-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vitrines actives</h3>
          </div>
          <div className="divide-y divide-border-soft dark:divide-slate-800">
            {isStorefrontsLoading ? (
              <div className="p-8 text-center text-slate-400">Chargement des storefronts...</div>
            ) : storefronts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucun storefront configuré.</div>
            ) : (
              storefronts.map((sf) => (
                <div key={sf.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-brand-purple-50 p-2 dark:bg-brand-purple-900/20">
                      <Globe size={20} className="text-brand-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{sf.name ?? sf.domain ?? sf.id}</h4>
                      {sf.domain && <p className="text-xs text-slate-500">{sf.domain}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(sf.status ?? "active")}`}>
                    {sf.status ?? "active"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Répartition par statut</h3>
            {orders.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Aucune donnée disponible.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  orders.reduce<Record<string, number>>((acc, o) => {
                    const s = o.status ?? "unknown";
                    acc[s] = (acc[s] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <div key={status} className="grid gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold uppercase ${statusStyle(status)}`}>
                        {statusIcon(status)} {status}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{count} / {orders.length}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-purple-500 dark:bg-brand-magenta-500 transition-all duration-500"
                        style={{ width: `${(count / orders.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Panier Moyen</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {orders.length > 0 ? `${(parseFloat(totalRevenue) / orders.length).toFixed(2)} €` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Taux de complétion</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {orders.length > 0 ? `${((completedCount / orders.length) * 100).toFixed(0)}%` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-3xl border border-border-soft bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="grid gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Commande</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">#{selectedOrder.order_number}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-ghost h-9 w-9 shrink-0 p-0 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedOrder.total} €</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Créé le</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{formatIsoDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {orderError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400">
                  {orderError}
                </div>
              )}
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full"
                >
                  <option value="pending">En attente</option>
                  <option value="processing">En cours</option>
                  <option value="completed">Complété</option>
                  <option value="delivered">Livré</option>
                  <option value="cancelled">Annulé</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary px-6">Annuler</button>
              <button
                disabled={updateMut.isPending}
                onClick={() => { setOrderError(""); updateMut.mutate({ id: selectedOrder.id, status: orderStatus }); }}
                className="btn-primary px-6"
              >
                {updateMut.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">{icon}</div>
        <ExternalLink size={14} className="text-slate-300" />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
