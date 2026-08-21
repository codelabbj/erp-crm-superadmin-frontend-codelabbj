import { X } from "lucide-react";
import type { PaymentTransactionItem } from "@/lib/adminApi";

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "medium" });
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  if (data == null || (typeof data === "object" && Object.keys(data as object).length === 0)) {
    return (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-6">{label}</p>
        <p className="text-sm text-neutral-6">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-6">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-neutral-1 p-3 text-xs text-neutral-8">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

type Props = {
  transaction: PaymentTransactionItem;
  onClose: () => void;
};

export function PaymentTransactionDetailModal({ transaction: t, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-10/55 p-4" role="dialog" aria-modal="true">
      <div className="grid max-h-[90vh] w-[min(96vw,720px)] gap-4 overflow-y-auto rounded-2xl border border-neutral-4 bg-neutral-0 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-lg font-semibold text-neutral-9">Détail transaction</h3>
            <p className="m-0 mt-1 font-mono text-xs text-neutral-6">{t.external_reference}</p>
          </div>
          <button type="button" className="btn-secondary !p-2" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-6">Organisation</dt>
            <dd className="font-medium">{t.organization_name || t.tenant_id}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Statut</dt>
            <dd className="font-medium">{t.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Montant</dt>
            <dd className="font-medium">
              {t.amount} {t.currency}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Provider PAL</dt>
            <dd className="font-mono text-xs">{t.provider_ref || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Usage / direction</dt>
            <dd>
              {t.purpose} · {t.direction}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">MoMo</dt>
            <dd>
              {t.operator || "—"} · {t.phone || "—"} ({t.country_code || "—"})
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-6">Callback URL</dt>
            <dd className="break-all font-mono text-xs">{t.callback_url}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Callback ERP envoyé</dt>
            <dd>{t.callback_dispatched ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">ID transaction</dt>
            <dd className="font-mono text-xs">{t.transaction_id}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Créée</dt>
            <dd>{formatDate(t.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Mise à jour</dt>
            <dd>{formatDate(t.updated_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-6">Payée</dt>
            <dd>{formatDate(t.paid_at)}</dd>
          </div>
        </dl>

        <JsonBlock label="Métadonnées" data={t.metadata} />
        <JsonBlock label="Réponse PAL" data={t.pal_response} />
        <JsonBlock label="Webhook PAL" data={t.webhook_payload} />
      </div>
    </div>
  );
}
