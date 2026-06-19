import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/features/dashboard/dashboardUtils";

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="m-0 text-sm font-bold tracking-wide text-slate-900 uppercase dark:text-slate-100">{title}</h3>
          {description ? <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  trend,
  trendLabel,
  accent = "purple",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: "purple" | "emerald" | "blue" | "amber" | "rose" | "slate";
}) {
  const accents = {
    purple: "bg-brand-purple-50 text-brand-purple-700 dark:bg-brand-purple-900/25 dark:text-brand-purple-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-800/50">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={cn("inline-flex rounded-lg p-2", accents[accent])}>{icon}</div>
        {trendLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
              trend === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              trend === "down" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
              trend === "neutral" && "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
            )}
          >
            {trend === "up" ? <ArrowUpRight size={12} /> : trend === "down" ? <ArrowDownRight size={12} /> : null}
            {trendLabel}
          </span>
        ) : null}
      </div>
      <p className="m-0 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</p>
      <p className="m-0 mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="m-0 mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </article>
  );
}

export function MiniBarChart({
  data,
  colorClass = "bg-brand-purple-500",
  emptyLabel = "Aucune donnée",
  unitLabel = "organisation(s)",
}: {
  data: Array<{ month: string; count: number }>;
  colorClass?: string;
  emptyLabel?: string;
  unitLabel?: string;
}) {
  if (!data.length) {
    return <p className="py-8 text-center text-xs text-slate-400">{emptyLabel}</p>;
  }

  const max = Math.max(...data.map((d) => d.count ?? 0), 1);
  const total = data.reduce((acc, d) => acc + (d.count ?? 0), 0);

  return (
    <div>
      <div className="relative flex h-40 items-end gap-2 pt-6">
        {data.slice(-8).map((d) => {
          const height = ((d.count ?? 0) / max) * 100;
          return (
            <div key={d.month} className="group flex min-w-0 flex-1 flex-col items-center">
              <span className="mb-1 text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                {d.count ?? 0}
              </span>
              <div
                className={cn("w-full rounded-t-md transition-all duration-500", colorClass)}
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${formatMonthLabel(d.month)} : ${d.count ?? 0} ${unitLabel}`}
              />
              <span className="mt-2 truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
                {formatMonthLabel(d.month)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
        Total affiché : <strong className="text-slate-700 dark:text-slate-200">{total}</strong> {unitLabel}
      </p>
    </div>
  );
}

export function DistributionBars({
  items,
  total,
}: {
  items: Array<{ label: string; count: number }>;
  total?: number;
}) {
  const sum = total ?? (items.reduce((acc, i) => acc + i.count, 0) || 1);

  if (!items.length) {
    return <p className="text-xs text-slate-400">—</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 6).map((item) => {
        const pct = Math.round((item.count / sum) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {item.count} <span className="text-[10px]">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple-500 to-brand-magenta-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AlertPill({
  label,
  count,
  tone,
  to,
}: {
  label: string;
  count: number;
  tone: "rose" | "amber" | "blue";
  to: string;
}) {
  const tones = {
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/15 dark:text-rose-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/15 dark:text-amber-300",
    blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-300",
  };

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition hover:brightness-[0.98]",
        tones[tone],
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
        {count}
        <ChevronRight size={14} />
      </span>
    </Link>
  );
}

export function HealthDot({ status }: { status: string }) {
  const ok = status === "ok";
  const degraded = status === "degraded";
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        ok && "bg-emerald-500",
        degraded && "bg-amber-500",
        !ok && !degraded && "bg-rose-500",
      )}
    />
  );
}
