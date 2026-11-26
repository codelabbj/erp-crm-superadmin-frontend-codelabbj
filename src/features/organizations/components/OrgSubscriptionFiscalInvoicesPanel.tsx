import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileCheck, Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  adminApi,
  type BusinessInvoiceItem,
  type SubscriptionFiscalInvoiceItem,
  type SubscriptionPaymentItem,
} from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { formatMoneyFromApi } from "@/lib/money";

const STATUS_LABELS: Record<string, string> = {
  pending: "En cours",
  generated: "Générée",
  failed: "Échec",
  skipped: "Ignorée",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    generated: "bg-emerald-100 text-emerald-800",
    failed: "bg-rose-100 text-rose-800",
    skipped: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type Props = {
  orgId: string;
  orgName: string;
};

export function OrgSubscriptionFiscalInvoicesPanel({ orgId, orgName }: Props) {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(true);

  const query = useQuery({
    queryKey: ["subscription-fiscal-invoices", orgId],
    queryFn: () =>
      adminApi.subscriptionFiscalInvoices({
        org_id: orgId,
        limit: 50,
        include_eligible: 1,
      }),
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["subscription-fiscal-invoices", orgId] });

  const generateMutation = useMutation({
    mutationFn: (payload: {
      business_invoice_id?: string;
      org_payment_id?: string;
    }) =>
      adminApi.generateSubscriptionFiscalInvoice({
        ...payload,
        send_email: sendEmail,
      }),
    onSuccess: () => {
      setFeedback("Facture normalisée générée.");
      refresh();
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => setBusyId(null),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => adminApi.retrySubscriptionFiscalInvoice(id),
    onSuccess: () => {
      setFeedback("Facture normalisée régénérée.");
      refresh();
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
    onSettled: () => setBusyId(null),
  });

  const download = async (record: SubscriptionFiscalInvoiceItem) => {
    setBusyId(record.id);
    setFeedback("");
    try {
      const blob = await adminApi.downloadSubscriptionFiscalInvoicePdf(record.id);
      downloadBlob(
        blob,
        `facture_${record.billing_invoice_number ?? record.id}.pdf`,
      );
    } catch (err) {
      setFeedback(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const records = query.data?.results ?? [];
  const eligibleBusiness = query.data?.eligible?.business_invoices ?? [];
  const eligiblePayments = query.data?.eligible?.org_payments ?? [];
  const eligibleCount = eligibleBusiness.length + eligiblePayments.length;
  const isGenerating = generateMutation.isPending || retryMutation.isPending;

  return (
    <section className="rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <FileCheck size={14} /> Factures normalisées DGI
          </h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            Émises au nom d'OwoDesk / CodeLab pour les abonnements de {orgName}.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(event) => setSendEmail(event.target.checked)}
          />
          Envoyer par e-mail
        </label>
      </div>

      {feedback ? (
        <p className="mx-5 mt-3 text-xs text-slate-600" role="status">
          {feedback}
        </p>
      ) : null}

      {query.isLoading ? (
        <p className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={16} /> Chargement…
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-2 text-left">Facture</th>
                  <th className="px-5 py-2 text-left">Réf. DGI</th>
                  <th className="px-5 py-2 text-left">Montant</th>
                  <th className="px-5 py-2 text-left">Statut</th>
                  <th className="px-5 py-2 text-left">Date</th>
                  <th className="px-5 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-3 font-mono text-xs">
                      {record.billing_invoice_number ?? "—"}
                      {record.commercial_reference ? (
                        <span className="ml-2 text-[10px] text-slate-400">
                          {record.commercial_reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                      {record.fiscal_reference || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {formatMoneyFromApi(record.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(record.status)}`}
                      >
                        {STATUS_LABELS[record.status] ?? record.status}
                      </span>
                      {record.error ? (
                        <p className="m-0 mt-1 max-w-[260px] text-[10px] text-rose-600">
                          {record.error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {formatIsoDate(
                        record.generated_at ?? record.created_at ?? undefined,
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {record.status === "generated" ? (
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[10px]"
                            disabled={busyId === record.id}
                            onClick={() => download(record)}
                          >
                            {busyId === record.id ? (
                              <Loader2 className="animate-spin" size={11} />
                            ) : (
                              <Download size={11} />
                            )}{" "}
                            Télécharger
                          </button>
                        ) : null}
                        {record.status === "failed" ? (
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[10px]"
                            disabled={isGenerating}
                            onClick={() => {
                              setBusyId(record.id);
                              retryMutation.mutate(record.id);
                            }}
                          >
                            <RefreshCw size={11} /> Rejouer
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!records.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-xs text-slate-400"
                    >
                      Aucune facture normalisée pour cette organisation.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <Sparkles size={13} /> Abonnements à normaliser
                </h4>
                <p className="m-0 mt-1 text-xs text-slate-400">
                  Abonnements payés sans facture normalisée.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {eligibleCount}
              </span>
            </div>

            {eligibleCount === 0 ? (
              <p className="m-0 mt-3 text-xs text-slate-400">
                Tout est à jour : chaque abonnement payé a sa facture normalisée.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2 text-left">Abonnement</th>
                      <th className="py-2 text-left">Plan / type</th>
                      <th className="py-2 text-left">Montant</th>
                      <th className="py-2 text-left">Payé le</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {eligibleBusiness.map((invoice: BusinessInvoiceItem) => (
                      <tr key={`bi-${invoice.id}`}>
                        <td className="py-3 font-mono text-xs">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-3 text-xs">
                          Business{" "}
                          {invoice.billing_cycle === "yearly"
                            ? "annuel"
                            : "mensuel"}
                        </td>
                        <td className="py-3">
                          {formatMoneyFromApi(invoice.amount_total)}
                        </td>
                        <td className="py-3 text-xs text-slate-500">
                          {formatIsoDate(invoice.paid_at ?? undefined)}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            className="btn-primary px-2 py-1 text-[10px]"
                            disabled={isGenerating}
                            onClick={() => {
                              setBusyId(invoice.id);
                              generateMutation.mutate({
                                business_invoice_id: invoice.id,
                              });
                            }}
                          >
                            <Sparkles size={11} /> Générer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {eligiblePayments.map(
                      (payment: SubscriptionPaymentItem) => (
                        <tr key={`pay-${payment.id}`}>
                          <td className="py-3 font-mono text-xs">
                            {payment.provider_ref ?? payment.id}
                          </td>
                          <td className="py-3 text-xs">
                            {payment.plan_name ?? "Abonnement"}{" "}
                            {payment.billing_cycle === "yearly"
                              ? "annuel"
                              : "mensuel"}
                          </td>
                          <td className="py-3">
                            {formatMoneyFromApi(payment.amount)}
                          </td>
                          <td className="py-3 text-xs text-slate-500">
                            {formatIsoDate(payment.paid_at ?? undefined)}
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              className="btn-primary px-2 py-1 text-[10px]"
                              disabled={isGenerating}
                              onClick={() => {
                                setBusyId(payment.id);
                                generateMutation.mutate({
                                  org_payment_id: payment.id,
                                });
                              }}
                            >
                              <Sparkles size={11} /> Générer
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
