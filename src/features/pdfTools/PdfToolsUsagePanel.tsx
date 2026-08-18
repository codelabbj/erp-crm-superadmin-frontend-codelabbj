import { useQuery } from "@tanstack/react-query";
import { Files, HardDrive, Monitor, Server, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { adminApi, type PdfToolUsageToolRow } from "../../lib/adminApi";
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";

function formatBytes(n: number) {
  const value = Number(n) || 0;
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} Ko`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

function formatCount(n: number) {
  return (Number(n) || 0).toLocaleString("fr-FR");
}

const PERIODS = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "all", label: "Tout" },
];

export function PdfToolsUsagePanel() {
  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pdf-tools-usage", period],
    queryFn: () => adminApi.pdfToolsUsage(period),
  });

  const tools = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.tools ?? [];
    if (!q) return list;
    return list.filter(
      (row) => row.code.toLowerCase().includes(q) || row.label.toLowerCase().includes(q),
    );
  }, [data?.tools, search]);

  const totals = data?.totals;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Traitements réels : navigateur (même sans compte) et serveur. Pas de nom de fichier.
        </p>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                period === item.id
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-slate-400">Chargement des stats…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={<Files size={18} className="text-brand-purple-500" />}
              label="Traitements"
              value={formatCount(totals?.runs ?? 0)}
              hint={`${formatCount(totals?.done ?? 0)} OK · ${formatCount(totals?.failed ?? 0)} échecs`}
            />
            <Kpi
              icon={<HardDrive size={18} className="text-blue-500" />}
              label="Volume traité"
              value={formatBytes(totals?.input_bytes ?? 0)}
              hint={`${formatCount(totals?.input_files ?? 0)} fichiers in → ${formatBytes(totals?.output_bytes ?? 0)} out`}
            />
            <Kpi
              icon={<Users size={18} className="text-emerald-500" />}
              label="Utilisateurs"
              value={formatCount(totals?.unique_users ?? 0)}
              hint={`${formatCount(totals?.unique_anonymous ?? 0)} visiteurs anonymes`}
            />
            <Kpi
              icon={<Monitor size={18} className="text-amber-500" />}
              label="Moteur"
              value={`${formatCount(totals?.client_runs ?? 0)} / ${formatCount(totals?.server_runs ?? 0)}`}
              hint="Navigateur / serveur"
            />
          </div>

          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Outil…" />
          </FilterBar>

          <div className="overflow-x-auto rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Outil</th>
                  <th className="px-4 py-3">Runs</th>
                  <th className="px-4 py-3">Fichiers</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Utilisateurs</th>
                  <th className="px-4 py-3">Moteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft dark:divide-slate-800">
                {tools.map((row) => (
                  <UsageRow key={row.code} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function UsageRow({ row }: { row: PdfToolUsageToolRow }) {
  return (
    <tr className="align-top hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900 dark:text-slate-100">{row.label}</div>
        <div className="font-mono text-[11px] text-slate-400">{row.code}</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-bold">{formatCount(row.runs)}</div>
        <div className="text-xs text-slate-500">
          {formatCount(row.done)} OK · {formatCount(row.failed)} échecs
        </div>
      </td>
      <td className="px-4 py-3">
        <div>{formatCount(row.input_files)} in</div>
        <div className="text-xs text-slate-500">{formatCount(row.output_files)} out</div>
      </td>
      <td className="px-4 py-3">
        <div>{formatBytes(row.input_bytes)}</div>
        <div className="text-xs text-slate-500">out {formatBytes(row.output_bytes)}</div>
      </td>
      <td className="px-4 py-3">
        <div>{formatCount(row.unique_users)} comptes</div>
        <div className="text-xs text-slate-500">{formatCount(row.unique_anonymous)} anonymes</div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Monitor size={12} /> {formatCount(row.client_runs)}
        </span>
        <span className="mx-1">·</span>
        <span className="inline-flex items-center gap-1">
          <Server size={12} /> {formatCount(row.server_runs)}
        </span>
      </td>
    </tr>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
