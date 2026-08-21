import { useQuery } from "@tanstack/react-query";
import { Server, Activity, AlertCircle, CheckCircle2, Clock, Globe, ShieldCheck, Building2 } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate } from "../../lib/ui";

export function PlatformHealth() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["platform-health-summary"],
    queryFn: () => adminApi.platformHealthSummary(),
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["platform-health-services"],
    queryFn: () => adminApi.platformHealthServices(),
  });

  if (isSummaryLoading || isServicesLoading) {
    return <div className="py-12 text-center text-slate-400">Chargement de l&apos;état système...</div>;
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Santé de la plateforme</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitorage en temps réel des services et de l&apos;infrastructure.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={14} />
          Mis à jour le {formatIsoDate(summary?.updated_at)}
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard
          title="Uptime Global"
          value={`${summary?.global_uptime_percent}%`}
          icon={<Globe size={20} className="text-blue-500" />}
          status="ok"
        />
        <HealthCard
          title="Latence API"
          value={`${summary?.avg_api_latency_ms}ms`}
          icon={<Activity size={20} className="text-emerald-500" />}
          status={summary?.avg_api_latency_ms && summary.avg_api_latency_ms > 300 ? "degraded" : "ok"}
        />
        <HealthCard
          title="Taux d'erreur"
          value={`${summary?.error_rate_percent}%`}
          icon={<AlertCircle size={20} className="text-rose-500" />}
          status={summary?.error_rate_percent && summary.error_rate_percent > 1 ? "degraded" : "ok"}
        />
        <HealthCard
          title="Organisations Actives"
          value={`${summary?.active_orgs} / ${summary?.total_orgs}`}
          icon={<Building2 size={20} className="text-brand-purple-500" />}
          status="ok"
        />
        <HealthCard
          title="Utilisateurs Actifs"
          value={`${summary?.active_users} / ${summary?.total_users}`}
          icon={<ShieldCheck size={20} className="text-brand-purple-500" />}
          status="ok"
        />
      </div>

      {/* Services List */}
      <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Statut des Services</h3>
        <div className="grid gap-3">
          {services?.services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-xl border border-slate-50 p-4 transition hover:border-slate-100 dark:border-slate-800/50 dark:hover:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${getStatusBg(service.status)}`}>
                  <Server size={16} className={getStatusColor(service.status)} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{service.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Latence: {service.latency_ms}ms • Erreur: {service.error_rate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={service.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, value, icon, status }: { title: string; value: string; icon: React.ReactNode; status: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800">{icon}</div>
        <StatusDot status={status} />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ok" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 animate-pulse rounded-full ${color}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{status}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "ok"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === "degraded"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  
  const icon = status === "ok" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style}`}>
      {icon} {status}
    </span>
  );
}

function getStatusBg(status: string) {
  if (status === "ok") return "bg-emerald-50 dark:bg-emerald-900/10";
  if (status === "degraded") return "bg-amber-50 dark:bg-amber-900/10";
  return "bg-rose-50 dark:bg-rose-900/10";
}

function getStatusColor(status: string) {
  if (status === "ok") return "text-emerald-500";
  if (status === "degraded") return "text-amber-500";
  return "text-rose-500";
}
