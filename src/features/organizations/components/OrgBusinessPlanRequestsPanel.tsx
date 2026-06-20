import { useState, Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import { adminApi, type BusinessPlanRequestItem } from "@/lib/adminApi";
import { formatIsoDate, getErrorMessage } from "@/lib/ui";
import { CreateBusinessInvoiceModal } from "@/features/businessInvoices/CreateBusinessInvoiceModal";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Reçue",
  in_review: "En traitement",
  invoice_sent: "Facture envoyée",
  completed: "Terminée",
  cancelled: "Annulée",
};

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  invoice_sent: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

const HOSTING_LABELS: Record<string, string> = {
  platform: "Plateforme OwoDesk",
  dedicated: "Serveur dédié",
};

type Props = {
  orgId: string;
  orgName: string;
  /** Afficher le bloc même sans demande (page facturation dédiée). */
  alwaysVisible?: boolean;
};

export function OrgBusinessPlanRequestsPanel({
  orgId,
  orgName,
  alwaysVisible = false,
}: Props) {
  const qc = useQueryClient();
  const [invoiceFromRequest, setInvoiceFromRequest] = useState<BusinessPlanRequestItem | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const requestsQuery = useQuery({
    queryKey: ["business-plan-requests", orgId],
    queryFn: () => adminApi.businessPlanRequests({ org_id: orgId, limit: 30 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateBusinessPlanRequest(id, { status }),
    onSuccess: () => {
      setFeedback("Statut mis à jour.");
      qc.invalidateQueries({ queryKey: ["business-plan-requests", orgId] });
    },
    onError: (err) => setFeedback(getErrorMessage(err)),
  });

  const requests = requestsQuery.data?.results ?? [];
  const openRequests = requests.filter(
    (r) => !["completed", "cancelled"].includes(r.status) && !r.business_invoice_id,
  );

  if (requestsQuery.isLoading) {
    return (
      <section className="mb-4 rounded-2xl border border-border-soft bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </section>
    );
  }

  if (!alwaysVisible && requests.length === 0) {
    return null;
  }

  return (
    <>
      <section className="mb-4 rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="m-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
              Demandes Business
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-400">
              {openRequests.length > 0
                ? `${openRequests.length} demande(s) en attente de facture`
                : "Soumissions depuis le portail abonnement client"}
            </p>
          </div>
          {openRequests.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {openRequests.length} à traiter
            </span>
          ) : null}
        </div>

        {feedback ? (
          <p className="mx-5 mt-3 text-xs text-slate-600 dark:text-slate-300">{feedback}</p>
        ) : null}

        {requests.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Aucune demande Business pour cette organisation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-800">
                  <th className="px-5 py-2 font-semibold">Réf.</th>
                  <th className="px-3 py-2 font-semibold">Statut</th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">Offre</th>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-5 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const expanded = expandedId === req.id;
                  const canInvoice =
                    !req.business_invoice_id &&
                    req.status !== "cancelled" &&
                    req.status !== "completed";
                  const canUpdateStatus =
                    req.status !== "completed" && req.status !== "cancelled";

                  return (
                    <Fragment key={req.id}>
                      <tr className="border-b border-slate-50 dark:border-slate-800/80">
                        <td className="px-5 py-3 font-medium">{req.reference}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[req.status] ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {STATUS_LABELS[req.status] ?? req.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div>{req.contact_name}</div>
                          <div className="text-xs text-slate-400">{req.contact_email}</div>
                          {req.contact_phone ? (
                            <div className="text-xs text-slate-400">{req.contact_phone}</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                          <div>{HOSTING_LABELS[req.deployment_type] ?? req.deployment_type}</div>
                          <div>
                            {req.billing_cycle === "monthly" ? "Mensuel" : "Annuel"} ·{" "}
                            {req.estimated_seats} sièges
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-500">{formatIsoDate(req.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {canInvoice ? (
                              <button
                                type="button"
                                className="btn-primary inline-flex items-center gap-1 text-xs"
                                onClick={() => setInvoiceFromRequest(req)}
                              >
                                <FileText size={14} />
                                Facturer
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {req.invoice_number ?? "—"}
                              </span>
                            )}
                            {canUpdateStatus ? (
                              <select
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                                value={req.status}
                                disabled={updateMutation.isPending}
                                onChange={(e) =>
                                  updateMutation.mutate({ id: req.id, status: e.target.value })
                                }
                              >
                                <option value="submitted">Reçue</option>
                                <option value="in_review">En traitement</option>
                                <option value="invoice_sent">Facture envoyée</option>
                                <option value="cancelled">Annulée</option>
                              </select>
                            ) : null}
                            <button
                              type="button"
                              className="btn-secondary inline-flex items-center gap-1 p-1.5 text-xs"
                              aria-expanded={expanded}
                              onClick={() => setExpandedId(expanded ? null : req.id)}
                            >
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${req.id}-detail`} className="bg-slate-50/80 dark:bg-slate-800/40">
                          <td colSpan={6} className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {req.message ? (
                              <p className="m-0 whitespace-pre-wrap">{req.message}</p>
                            ) : (
                              <p className="m-0 italic text-slate-400">Aucun message complémentaire.</p>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {invoiceFromRequest ? (
        <CreateBusinessInvoiceModal
          orgId={orgId}
          orgName={orgName}
          defaultRecipientEmail={invoiceFromRequest.contact_email}
          sourceRequest={invoiceFromRequest}
          onClose={() => setInvoiceFromRequest(null)}
          onCreated={() => {
            setInvoiceFromRequest(null);
            setFeedback("Facture créée et liée à la demande.");
            qc.invalidateQueries({ queryKey: ["business-plan-requests", orgId] });
            qc.invalidateQueries({ queryKey: ["business-invoices", orgId] });
          }}
          onError={(msg) => setFeedback(msg)}
        />
      ) : null}
    </>
  );
}
