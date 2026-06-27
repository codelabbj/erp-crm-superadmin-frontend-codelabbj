import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw, Server } from "lucide-react";
import { adminApi, type DedicatedInstanceItem } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending_install: "bg-amber-100 text-amber-800",
    active: "bg-emerald-100 text-emerald-800",
    suspended: "bg-rose-100 text-rose-800",
    expired: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

type Props = {
  orgId: string;
};

export function OrgDedicatedInstancePanel({ orgId }: Props) {
  const [feedback, setFeedback] = useState("");
  const [licenseJson, setLicenseJson] = useState<string | null>(null);
  const qc = useQueryClient();
  const { ask, close, renderDialog } = useConfirmDialog();

  const query = useQuery({
    queryKey: ["dedicated-instances", orgId],
    queryFn: () => adminApi.dedicatedInstances({ limit: 100 }),
    select: (data) => (data.results ?? []).filter((i: DedicatedInstanceItem) => i.org_id === orgId),
  });

  const instance = query.data?.[0] ?? null;

  const sendKitMutation = useMutation({
    mutationFn: (instanceId: string) => adminApi.sendDedicatedInstallKit(instanceId),
    onSuccess: () => {
      setFeedback("Kit d'installation envoyé par e-mail.");
      qc.invalidateQueries({ queryKey: ["dedicated-instances", orgId] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => close(),
  });

  const issueLicenseMutation = useMutation({
    mutationFn: (instanceId: string) => adminApi.issueDedicatedLicense(instanceId),
    onSuccess: (data) => {
      setLicenseJson(JSON.stringify(data.license, null, 2));
      setFeedback("Licence générée.");
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => close(),
  });

  if (query.isLoading) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={16} /> Instance dédiée…
        </p>
      </section>
    );
  }

  if (!instance) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <Server size={14} /> Instance serveur dédié
          </h3>
          <p className="m-0 mt-1 font-mono text-[10px] text-slate-400">{instance.instance_id}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadge(instance.status)}`}>
          {instance.status}
        </span>
      </div>

      {feedback ? (
        <p className="mx-5 mt-3 text-xs text-slate-600" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
        <div>
          <p className="m-0 text-[10px] font-bold uppercase text-slate-400">Expiration licence</p>
          <p className="m-0 text-sm text-slate-800 dark:text-slate-200">
            {instance.license_expires_at ? formatIsoDate(instance.license_expires_at) : "—"}
          </p>
        </div>
        <div>
          <p className="m-0 text-[10px] font-bold uppercase text-slate-400">Dernier heartbeat</p>
          <p className="m-0 text-sm text-slate-800 dark:text-slate-200">
            {instance.last_heartbeat_at ? formatIsoDate(instance.last_heartbeat_at) : "—"}
          </p>
        </div>
        {instance.host_url ? (
          <div className="sm:col-span-2">
            <p className="m-0 text-[10px] font-bold uppercase text-slate-400">URL client</p>
            <p className="m-0 truncate text-sm text-slate-800 dark:text-slate-200">{instance.host_url}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={sendKitMutation.isPending}
          onClick={() =>
            ask({
              description: "Renvoyer le kit d'installation par e-mail au client ?",
              confirmText: "Envoyer",
              action: () => sendKitMutation.mutate(instance.instance_id),
            })
          }
        >
          <Mail size={14} className="mr-1 inline" /> Renvoyer kit install
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={issueLicenseMutation.isPending}
          onClick={() =>
            ask({
              description: "Générer une nouvelle licence pour cette instance ? L'ancienne sera invalidée.",
              confirmText: "Générer",
              action: () => issueLicenseMutation.mutate(instance.instance_id),
            })
          }
        >
          <RefreshCw size={14} className="mr-1 inline" /> Générer licence
        </button>
      </div>

      {licenseJson ? (
        <div className="mx-5 mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Fichier .license</p>
          <pre className="max-h-40 overflow-auto text-[10px]">{licenseJson}</pre>
        </div>
      ) : null}

      {renderDialog(sendKitMutation.isPending || issueLicenseMutation.isPending)}
    </section>
  );
}
