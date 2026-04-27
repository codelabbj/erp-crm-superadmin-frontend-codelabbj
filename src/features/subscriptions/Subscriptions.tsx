import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../lib/adminApi";
import { formatIsoDate, getErrorMessage } from "../../lib/ui";

type PendingAction =
  | { kind: "assign_plan"; planCode: string }
  | { kind: "add_seats"; seats: number }
  | { kind: "activate_trial"; subId: string }
  | { kind: "switch_cycle"; subId: string; nextCycle: string }
  | { kind: "extend"; subId: string; endsAt: string }
  | { kind: "cancel"; subId: string };

type SubscriptionsProps = {
  /** Depuis le dashboard: ouvrir directement le detail de cette org (une seule consommation). */
  focusOrgId?: string | null;
  onFocusOrgHandled?: () => void;
};

export function Subscriptions({ focusOrgId, onFocusOrgHandled }: SubscriptionsProps) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [seatsToAdd, setSeatsToAdd] = useState("1");
  const [feedback, setFeedback] = useState("");
  const [extendDateBySubId, setExtendDateBySubId] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const limit = 30;
  const qc = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["platform-plans"],
    queryFn: () => adminApi.licensingPlans(),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["org-subscriptions-overview", q, statusFilter, planFilter, offset],
    queryFn: () =>
      adminApi.organizationsOverview({
        q: q || undefined,
        plan: planFilter || undefined,
        status: statusFilter || undefined,
        limit,
        offset,
        sort: "-created_at",
      }),
  });

  const selectedOrg = useMemo(
    () => (data?.results ?? []).find((org) => org.id === selectedOrgId) ?? null,
    [data?.results, selectedOrgId],
  );

  useEffect(() => {
    if (selectedOrgId) return;
    if (focusOrgId) {
      setSelectedOrgId(focusOrgId);
      onFocusOrgHandled?.();
      return;
    }
    const firstOrgId = data?.results?.[0]?.id;
    if (firstOrgId) setSelectedOrgId(firstOrgId);
  }, [data?.results, selectedOrgId, focusOrgId, onFocusOrgHandled]);

  useEffect(() => {
    if (!selectedOrg?.plan_code) {
      setSelectedPlanCode("");
      return;
    }
    setSelectedPlanCode(selectedOrg.plan_code);
  }, [selectedOrg?.plan_code]);

  const orgDetailQuery = useQuery({
    queryKey: ["org-detail", selectedOrgId],
    queryFn: () => adminApi.organizationDetail(selectedOrgId as string),
    enabled: Boolean(selectedOrgId),
  });

  const orgSubsQuery = useQuery({
    queryKey: ["org-subscriptions", selectedOrgId],
    queryFn: () => adminApi.organizationSubscriptions(selectedOrgId as string, { limit: 100, offset: 0, sort: "-starts_at" }),
    enabled: Boolean(selectedOrgId),
  });

  const refreshOrgData = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["org-subscriptions-overview"] }),
      qc.invalidateQueries({ queryKey: ["org-detail", selectedOrgId] }),
      qc.invalidateQueries({ queryKey: ["org-subscriptions", selectedOrgId] }),
    ]);
  };

  const assignPlanMut = useMutation({
    mutationFn: (plan_code: string) => adminApi.assignPlanToOrganization(selectedOrgId as string, { plan_code }),
    onSuccess: async () => {
      setFeedback("Plan assigne a l'organisation.");
      await refreshOrgData();
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const addSeatsMut = useMutation({
    mutationFn: (seats: number) => adminApi.addSeatsToOrganization(selectedOrgId as string, { seats }),
    onSuccess: async () => {
      setFeedback("Sieges ajoutes.");
      await refreshOrgData();
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const patchSubMut = useMutation({
    mutationFn: (args: { id: string; payload: { status?: string; billing_cycle?: string; ends_at?: string; auto_renew?: boolean } }) =>
      adminApi.patchSubscription(args.id, args.payload),
    onSuccess: async () => {
      setFeedback("Abonnement mis a jour.");
      await refreshOrgData();
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const deleteSubMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscription(id),
    onSuccess: async () => {
      setFeedback("Abonnement resilie.");
      await refreshOrgData();
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const extendSubMut = useMutation({
    mutationFn: (args: { id: string; ends_at: string }) => adminApi.extendSubscription(args.id, { ends_at: args.ends_at }),
    onSuccess: async () => {
      setFeedback("Abonnement prolonge.");
      await refreshOrgData();
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  });

  const isMutating =
    assignPlanMut.isPending || addSeatsMut.isPending || patchSubMut.isPending || deleteSubMut.isPending || extendSubMut.isPending;

  const getConfirmMessage = (action: PendingAction): string => {
    switch (action.kind) {
      case "assign_plan":
        return `Confirmer l'assignation du plan "${action.planCode}" a cette organisation ?`;
      case "add_seats":
        return `Confirmer l'ajout de ${action.seats} siege(s) a cette organisation ?`;
      case "activate_trial":
        return "Confirmer le passage de cet abonnement de trial a actif ?";
      case "switch_cycle":
        return `Confirmer le changement de cycle vers "${action.nextCycle}" ?`;
      case "extend":
        return `Confirmer la prolongation de cet abonnement jusqu'au ${action.endsAt} ?`;
      case "cancel":
        return "Confirmer la resiliation de cet abonnement ?";
      default:
        return "Confirmer cette action ?";
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction || isMutating) return;
    switch (pendingAction.kind) {
      case "assign_plan":
        assignPlanMut.mutate(pendingAction.planCode, { onSettled: () => setPendingAction(null) });
        break;
      case "add_seats":
        addSeatsMut.mutate(pendingAction.seats, { onSettled: () => setPendingAction(null) });
        break;
      case "activate_trial":
        patchSubMut.mutate({ id: pendingAction.subId, payload: { status: "active" } }, { onSettled: () => setPendingAction(null) });
        break;
      case "switch_cycle":
        patchSubMut.mutate(
          { id: pendingAction.subId, payload: { billing_cycle: pendingAction.nextCycle } },
          { onSettled: () => setPendingAction(null) },
        );
        break;
      case "extend":
        extendSubMut.mutate(
          { id: pendingAction.subId, ends_at: pendingAction.endsAt },
          { onSettled: () => setPendingAction(null) },
        );
        break;
      case "cancel":
        deleteSubMut.mutate(pendingAction.subId, { onSettled: () => setPendingAction(null) });
        break;
    }
  };

  return (
    <div className="rounded-xl border border-border-soft bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Abonnements par organisation</h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Recherche organisation
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Nom d'organisation..."
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Statut
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tous</option>
            <option value="active">actif</option>
            <option value="suspended">suspendu</option>
            <option value="trial">essai</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-slate-300">
          Plan
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Tous</option>
            <option value="none">Aucun</option>
            {(plans ?? []).map((plan) => (
              <option key={plan.id} value={plan.code}>
                {plan.name} ({plan.code})
              </option>
            ))}
          </select>
        </label>
      </div>
      {feedback ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">{feedback}</p> : null}
      {isLoading ? <p className="mb-3 text-xs text-text-muted dark:text-slate-400">Chargement...</p> : null}
      {isError ? <p className="mb-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Organisation</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Plan actif</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Sieges</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Modules actifs</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Date creation</th>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((org) => (
              <tr
                key={org.id}
                className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 ${
                  selectedOrgId === org.id ? "bg-brand-magenta-50/40 dark:bg-brand-magenta-950/20" : ""
                }`}
                onClick={() => setSelectedOrgId(org.id)}
              >
                <td className="px-2 py-2">
                  <p className="m-0 text-slate-800 dark:text-slate-200">{org.name}</p>
                  <p className="m-0 text-xs text-text-muted dark:text-slate-400">{org.slug}</p>
                </td>
                <td className="px-2 py-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {org.plan_code || "Aucun"}
                  </span>
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">
                  {org.seats_used ?? 0} / {org.seats_included ?? 0}
                  {(org.additional_seats ?? 0) > 0 ? ` + ${org.additional_seats}` : ""}
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{org.active_modules_count ?? 0}</td>
                <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(org.created_at)}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      org.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : org.status === "trial"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {org.status || (org.is_active ? "active" : "suspendu")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br /><br />
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
          onClick={() => setOffset((v) => Math.max(0, v - limit))}
          disabled={offset === 0}
        >
          Precedent
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
          onClick={() => setOffset((v) => v + limit)}
          disabled={(data?.results?.length ?? 0) < limit}
        >
          Suivant
        </button>
      </div>
      <p className="mb-0 text-xs text-text-muted dark:text-slate-400">
        Total : {data?.count ?? 0} (page {Math.floor(offset / limit) + 1}, limite {limit})
      </p>

      {selectedOrgId ? (
        <section className="mt-5 grid gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h4 className="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">Detail organisation</h4>
            <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
              {orgDetailQuery.data?.name ?? selectedOrg?.name ?? "Organisation"} ({orgDetailQuery.data?.slug ?? selectedOrg?.slug ?? "—"})
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Plan</p>
              <p className="m-0 mb-2 text-sm text-slate-700 dark:text-slate-300">
                Actuel: <strong>{orgDetailQuery.data?.plan_code ?? selectedOrg?.plan_code ?? "Aucun"}</strong>
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-xs text-gray-700 dark:text-slate-300">
                  Changer de plan
                  <select
                    value={selectedPlanCode}
                    onChange={(e) => setSelectedPlanCode(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selectionner</option>
                    {(plans ?? []).map((plan) => (
                      <option key={plan.id} value={plan.code}>
                        {plan.name} ({plan.code})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!selectedPlanCode || isMutating}
                  onClick={() => setPendingAction({ kind: "assign_plan", planCode: selectedPlanCode })}
                >
                  Assigner
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Sieges</p>
              <p className="m-0 mb-2 text-sm text-slate-700 dark:text-slate-300">
                {orgDetailQuery.data?.seats_used ?? selectedOrg?.seats_used ?? 0} /
                {" "}
                {orgDetailQuery.data?.seats_included ?? selectedOrg?.seats_included ?? 0}
                {(orgDetailQuery.data?.additional_seats ?? selectedOrg?.additional_seats ?? 0) > 0
                  ? ` + ${orgDetailQuery.data?.additional_seats ?? selectedOrg?.additional_seats ?? 0}`
                  : ""}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-xs text-gray-700 dark:text-slate-300">
                  Ajouter des sieges
                  <input
                    type="number"
                    min={1}
                    value={seatsToAdd}
                    onChange={(e) => setSeatsToAdd(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-magenta-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={Number(seatsToAdd) <= 0 || isMutating}
                  onClick={() => setPendingAction({ kind: "add_seats", seats: Number(seatsToAdd) })}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="m-0 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Abonnements de l&apos;organisation</p>
            {orgSubsQuery.isLoading ? <p className="m-0 text-xs text-slate-500 dark:text-slate-400">Chargement...</p> : null}
            {orgSubsQuery.isError ? <p className="m-0 text-xs text-red-700">{getErrorMessage(orgSubsQuery.error)}</p> : null}
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Module</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Statut</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Cycle</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Debut</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Fin</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Renouvellement auto</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(orgSubsQuery.data?.results ?? []).map((sub) => (
                    <tr key={sub.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{sub.module.name}</td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{sub.status}</td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{sub.billing_cycle || "—"}</td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(sub.starts_at || undefined)}</td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{formatIsoDate(sub.ends_at || undefined)}</td>
                      <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{sub.auto_renew ? "Oui" : "Non"}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                            disabled={isMutating}
                            onClick={() => setPendingAction({ kind: "activate_trial", subId: sub.id })}
                          >
                            Trial → Actif
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                            disabled={isMutating}
                            onClick={() =>
                              setPendingAction({
                                kind: "switch_cycle",
                                subId: sub.id,
                                nextCycle: sub.billing_cycle === "monthly" ? "yearly" : "monthly",
                              })
                            }
                          >
                            Cycle {sub.billing_cycle === "monthly" ? "→ Annuel" : "→ Mensuel"}
                          </button>
                          <label className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700">
                            <span className="text-slate-600 dark:text-slate-300">Fin</span>
                            <input
                              type="date"
                              value={extendDateBySubId[sub.id] ?? ""}
                              onChange={(e) => setExtendDateBySubId((v) => ({ ...v, [sub.id]: e.target.value }))}
                              className="rounded border border-gray-300 bg-white px-1 py-0.5 text-xs text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </label>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-brand-magenta-500 hover:bg-brand-magenta-50 hover:text-brand-magenta-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-magenta-400 dark:hover:bg-slate-700 dark:hover:text-brand-magenta-300"
                            disabled={!extendDateBySubId[sub.id] || isMutating}
                            onClick={() => setPendingAction({ kind: "extend", subId: sub.id, endsAt: extendDateBySubId[sub.id] })}
                          >
                            Prolonger
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-900/20"
                            disabled={isMutating}
                            onClick={() => setPendingAction({ kind: "cancel", subId: sub.id })}
                          >
                            Resilier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
      {pendingAction ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-gray-900/55 p-4">
          <div className="grid w-[min(92vw,460px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">Confirmer l'action</h4>
            <p className="m-0 text-sm text-gray-700 dark:text-slate-300">{getConfirmMessage(pendingAction)}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => setPendingAction(null)}
                disabled={isMutating}
              >
                Annuler
              </button>
              <button
                type="button"
                className={`cursor-pointer rounded-md px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                  pendingAction.kind === "cancel"
                    ? "border border-red-600 bg-red-600"
                    : "border border-brand-magenta-500 bg-brand-magenta-600"
                }`}
                onClick={handleConfirmAction}
                disabled={isMutating}
              >
                {isMutating ? "Application..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
