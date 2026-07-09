import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/FilterBar";
import { useDebouncedValue } from "@/hooks/useListState";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

function formatMoney(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export function Partners() {
  const queryClient = useQueryClient();
  const { ask, renderDialog } = useConfirmDialog();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [rateDraft, setRateDraft] = useState("");
  const [feeDraft, setFeeDraft] = useState("");
  const [minDraft, setMinDraft] = useState("");

  const { data: program } = useQuery({
    queryKey: ["partner-program-settings"],
    queryFn: () => adminApi.partnerProgramSettings(),
  });

  useEffect(() => {
    if (!program) return;
    setRateDraft(program.default_commission_rate);
    setFeeDraft(program.payout_fee);
    setMinDraft(program.min_withdrawal_amount);
  }, [program]);

  const { data: partners, isLoading } = useQuery({
    queryKey: ["admin-partners", debouncedQ],
    queryFn: () => adminApi.partners(debouncedQ ? { q: debouncedQ } : undefined),
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["admin-partner-withdrawals"],
    queryFn: () => adminApi.partnerWithdrawals(),
  });

  const saveProgram = useMutation({
    mutationFn: () =>
      adminApi.updatePartnerProgramSettings({
        default_commission_rate: rateDraft,
        payout_fee: feeDraft,
        min_withdrawal_amount: minDraft,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-program-settings"] }),
  });

  const patchPartner = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; commission_rate?: string } }) =>
      adminApi.updatePartner(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-partners"] }),
  });

  const withdrawalAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.partnerWithdrawalAction(id, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-partner-withdrawals"] }),
  });

  return (
    <ListPageShell>
      <PageHeader title="Partenaires" description="Programme de parrainage, taux et retraits MoMo (PAL payout)." />

      <section className="mb-6 rounded-2xl border border-neutral-4 bg-neutral-0 p-4">
        <h2 className="mb-3 text-base font-semibold text-neutral-9">Paramètres programme</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Taux par défaut (%)
            <input className="input" value={rateDraft} onChange={(e) => setRateDraft(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Frais PAL fixe (FCFA)
            <input className="input" value={feeDraft} onChange={(e) => setFeeDraft(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Retrait minimum (FCFA)
            <input className="input" value={minDraft} onChange={(e) => setMinDraft(e.target.value)} />
          </label>
        </div>
        <button
          type="button"
          className="btn-magenta mt-3"
          disabled={saveProgram.isPending}
          onClick={() => saveProgram.mutate()}
        >
          Enregistrer
        </button>
        {saveProgram.isError && (
          <p className="mt-2 text-sm text-danger-3">{getErrorMessage(saveProgram.error)}</p>
        )}
      </section>

      <div className="mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un partenaire…" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-4 bg-neutral-0">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-1 text-left text-neutral-7">
            <tr>
              <th className="px-3 py-2">Partenaire</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Taux</th>
              <th className="px-3 py-2">Solde</th>
              <th className="px-3 py-2">Clients</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(partners?.results ?? []).map((p) => (
              <tr key={p.id} className="border-t border-neutral-3">
                <td className="px-3 py-2">
                  <div className="font-medium text-neutral-9">{p.name}</div>
                  <div className="text-xs text-neutral-6">{p.user_email || p.email}</div>
                </td>
                <td className="px-3 py-2">{p.code}</td>
                <td className="px-3 py-2">{p.commission_rate} %</td>
                <td className="px-3 py-2">{formatMoney(p.available_balance)}</td>
                <td className="px-3 py-2">{p.clients_count}</td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() =>
                      ask({
                        title: p.status === "active" ? "Suspendre le partenaire ?" : "Réactiver le partenaire ?",
                        description: p.name,
                        confirmText: "Confirmer",
                        action: () => {
                          const next = p.status === "active" ? "suspended" : "active";
                          patchPartner.mutate({ id: p.id, payload: { status: next } });
                        },
                      })
                    }
                  >
                    {p.status === "active" ? "Suspendre" : "Réactiver"}
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && (partners?.results?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-6">
                  Aucun partenaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-neutral-9">Retraits récents</h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-4 bg-neutral-0">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-1 text-left text-neutral-7">
              <tr>
                <th className="px-3 py-2">Partenaire</th>
                <th className="px-3 py-2">Demandé</th>
                <th className="px-3 py-2">Frais</th>
                <th className="px-3 py-2">Net MoMo</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(withdrawals?.results ?? []).slice(0, 20).map((w) => (
                <tr key={w.id} className="border-t border-neutral-3">
                  <td className="px-3 py-2">{w.partner_name}</td>
                  <td className="px-3 py-2">{formatMoney(w.amount)}</td>
                  <td className="px-3 py-2">{formatMoney(w.fee_amount)}</td>
                  <td className="px-3 py-2">{formatMoney(w.net_amount)}</td>
                  <td className="px-3 py-2">{w.status}</td>
                  <td className="px-3 py-2">
                    {w.status === "processing" && (
                      <button
                        type="button"
                        className="btn-secondary text-xs mr-1"
                        onClick={() => withdrawalAction.mutate({ id: w.id, action: "mark-paid" })}
                      >
                        Marquer payé
                      </button>
                    )}
                    {(w.status === "processing" || w.status === "pending") && (
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() =>
                          ask({
                            title: "Marquer en échec ?",
                            description: "Les commissions seront recréditées au solde.",
                            confirmText: "Confirmer",
                            danger: true,
                            action: () => withdrawalAction.mutate({ id: w.id, action: "mark-failed" }),
                          })
                        }
                      >
                        Échec
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {renderDialog(withdrawalAction.isPending || patchPartner.isPending)}
    </ListPageShell>
  );
}
