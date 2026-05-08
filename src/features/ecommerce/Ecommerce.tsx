import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Store, Package, CreditCard, ExternalLink, ArrowRight, TrendingUp } from "lucide-react";
import { adminApi, type EcommerceOrder } from "../../lib/adminApi";
import { formatIsoDate, normalizeList } from "../../lib/ui";

export function Ecommerce() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-ecommerce-orders"],
    queryFn: () => adminApi.ecommerceOrders(),
  });

  const orders = useMemo(() => normalizeList<EcommerceOrder>(ordersData), [ordersData]);

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">E-commerce Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Surveillance des ventes en ligne et des vitrines storefront.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Store size={18} /> Storefronts
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-purple-700 active:scale-95">
            <TrendingUp size={18} /> Analytics
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Commandes (Total)" value={orders.length} icon={<ShoppingCart className="text-blue-500" size={20} />} />
        <MetricCard title="Ventes Brutes" value="0.00 €" icon={<CreditCard className="text-emerald-500" size={20} />} />
        <MetricCard title="Produits Actifs" value="0" icon={<Package className="text-brand-magenta-500" size={20} />} />
      </div>

      <div className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-border-soft p-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dernières Commandes</h3>
          <button className="text-xs font-bold text-brand-purple-600 hover:underline dark:text-brand-purple-400">Voir tout</button>
        </div>
        <div className="divide-y divide-border-soft dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Chargement des commandes...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Aucune commande récente.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-5 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">
                    <ShoppingCart size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">#{order.order_number}</h4>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatIsoDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{order.total} €</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Payé via CB</p>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
