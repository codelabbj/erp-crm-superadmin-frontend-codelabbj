import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { useState } from "react";
import { adminApi } from "../../lib/adminApi";
import { formatMoney } from "@/lib/money";

export function BusinessMetrics() {
  const [period, setPeriod] = useState("30d");
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["business-metrics", period],
    queryFn: () => adminApi.businessMetrics({ period }),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-slate-400">Analyse des indicateurs financiers...</div>;
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Métriques Business</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suivi du MRR, ARR et de la croissance de la plateforme.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50">
          {["30d", "90d", "365d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase transition-all duration-200 ${
                period === p
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="MRR (Revenu Mensuel)"
          value={metrics?.mrr !== undefined ? formatMoney(metrics.mrr) : "—"}
          change="+12.5%"
          trend="up"
          icon={<DollarSign size={20} className="text-emerald-500" />}
        />
        <MetricCard
          title="ARR (Revenu Annuel)"
          value={metrics?.arr !== undefined ? formatMoney(metrics.arr) : "—"}
          change="+8.2%"
          trend="up"
          icon={<TrendingUp size={20} className="text-blue-500" />}
        />
        <MetricCard
          title="Churn Rate (Attrition)"
          value={metrics?.churn_rate !== undefined ? `${metrics.churn_rate}%` : "—"}
          change="-0.4%"
          trend="up"
          icon={<PieChart size={20} className="text-rose-500" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Tenants Actifs"
          value={metrics?.active_tenants !== undefined ? metrics.active_tenants.toLocaleString() : "—"}
          icon={<Users size={20} className="text-brand-purple-500" />}
        />
        <MetricCard
          title="Revenue Retention"
          value={metrics?.net_revenue_retention !== undefined ? `${metrics.net_revenue_retention}%` : "—"}
          icon={<ArrowUpRight size={20} className="text-emerald-500" />}
        />
        <MetricCard
          title="Trial to Paid"
          value={metrics?.trial_to_paid_rate !== undefined ? `${metrics.trial_to_paid_rate}%` : "—"}
          icon={<Calendar size={20} className="text-brand-magenta-500" />}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-6 text-sm font-semibold text-slate-900 dark:text-slate-100">Croissance des Organisations (Time Series)</h3>
        <div className="grid gap-8">
          <TimeSeriesTable
            title="Nouveaux Tenants"
            data={metrics?.time_series.new_tenants_by_month || []}
            colorClass="bg-brand-purple-500"
          />
          <TimeSeriesTable
            title="Nouveaux Abonnements"
            data={metrics?.time_series.new_subscriptions_by_month || []}
            colorClass="bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon }: { title: string; value: string | number; change?: string; trend?: "up" | "down"; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">{icon}</div>
        {change && (
          <div className={`flex items-center gap-0.5 text-xs font-bold ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function TimeSeriesTable({ title, data, colorClass }: { title: string; data: Array<{ month: string; count: number }>; colorClass: string }) {
  const max = Math.max(...data.map(d => d.count ?? 0), 1);
  
  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h4>
        <span className="text-[10px] font-medium text-slate-400">Total: {data.reduce((acc, curr) => acc + (curr.count ?? 0), 0)}</span>
      </div>
      
      <div className="relative flex h-48 items-end gap-3 px-2 pt-8">
        {/* Horizontal Grid Lines */}
        <div className="absolute inset-x-0 top-8 bottom-0 flex flex-col justify-between pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-t border-slate-100 dark:border-slate-800/50" />
          ))}
        </div>

        {data.map((d) => {
          const heightPercent = ((d.count ?? 0) / max) * 100;
          return (
            <div key={d.month} className="group relative flex flex-1 flex-col items-center">
              {/* Tooltip/Count Label */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-xl transition-all group-hover:-top-9 dark:bg-slate-800">
                {d.count ?? 0}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900 dark:bg-slate-800" />
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-500 ease-out hover:brightness-110 ${colorClass} shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)]`}
                style={{ height: `${heightPercent}%` }}
              >
                <div className="h-full w-full opacity-20 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Month Label */}
              <span className="mt-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
