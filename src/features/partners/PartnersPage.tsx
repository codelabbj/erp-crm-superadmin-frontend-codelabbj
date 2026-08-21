import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminPartnerItem, type AdminPartnerWithdrawalItem } from "@/lib/adminApi";
import { useDebouncedValue } from "@/hooks/useListState";
import { FilterBar, SearchInput } from "@/components/ui/FilterBar";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

function formatMoney(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function PartnerStatusToggle({ partner }: { partner: AdminPartnerItem }) {
  const queryClient = useQueryClient();
  const isActive = partner.status === "active";

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updatePartnerStatus(partner.id, isActive ? "suspended" : "active"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold",
        isActive ? "bg-red-100 text-red-800 hover:bg-red-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
      )}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "…" : isActive ? "Désactiver" : "Réactiver"}
    </button>
  );
}

function WithdrawalActions({ row }: { row: AdminPartnerWithdrawalItem }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const action = useMutation({
    mutationFn: (kind: "approve" | "reject" | "mark-paid") =>
      adminApi.partnerWithdrawalAction(row.id, { action: kind, admin_notes: notes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-partner-withdrawals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
    },
  });

  if (row.status === "paid" || row.status === "rejected") {
    return <span className="text-xs text-slate-500">{row.status}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        className="rounded border px-2 py-1 text-xs"
        placeholder="Notes admin"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex flex-wrap gap-1">
        {row.status === "pending" && (
          <>
            <button type="button" className="rounded bg-emerald-100 px-2 py-1 text-xs" onClick={() => action.mutate("approve")}>
              Approuver
            </button>
            <button type="button" className="rounded bg-red-100 px-2 py-1 text-xs" onClick={() => action.mutate("reject")}>
              Rejeter
            </button>
          </>
        )}
        {(row.status === "pending" || row.status === "approved") && (
          <button type="button" className="rounded bg-violet-100 px-2 py-1 text-xs" onClick={() => action.mutate("mark-paid")}>
            Marquer payé
          </button>
        )}
      </div>
    </div>
  );
}

export function PartnersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const partnersQuery = useQuery({
    queryKey: ["admin-partners", debouncedSearch],
    queryFn: () => adminApi.partners({ q: debouncedSearch || undefined }),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["admin-partner-withdrawals", "pending"],
    queryFn: () => adminApi.partnerWithdrawals({ status: "pending" }),
  });

  const partners = partnersQuery.data?.results ?? [];
  const pendingWithdrawals = withdrawalsQuery.data?.results ?? [];

  const referralBase = useMemo(() => `${window.location.origin.replace(/\/$/, "")}/register?ref=`, []);

  return (
    <ListPageShell>
      <PageHeader
        title="Partenaires"
        description="Comptes créés en self-service — vous pouvez uniquement désactiver ou réactiver un partenaire."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher nom, code, email…" />
      </FilterBar>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Partenaire</th>
              <th className="px-4 py-3">Code / lien</th>
              <th className="px-4 py-3">Taux</th>
              <th className="px-4 py-3">Clients</th>
              <th className="px-4 py-3">Solde</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/80">
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.account_email || p.email || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">{p.code}</div>
                  <button
                    type="button"
                    className="text-xs text-brand-purple-600"
                    onClick={() => navigator.clipboard.writeText(`${referralBase}${p.code}`)}
                  >
                    Copier le lien
                  </button>
                </td>
                <td className="px-4 py-3">{p.commission_rate}%</td>
                <td className="px-4 py-3">{p.clients_count}</td>
                <td className="px-4 py-3">{formatMoney(p.available_balance)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700",
                    )}
                  >
                    {p.status === "active" ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PartnerStatusToggle partner={p} />
                </td>
              </tr>
            ))}
            {partners.length === 0 && !partnersQuery.isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Aucun partenaire inscrit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold">Retraits en attente ({pendingWithdrawals.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Partenaire</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">MoMo</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingWithdrawals.map((w) => (
                <tr key={w.id} className="border-b border-slate-50 dark:border-slate-800/80">
                  <td className="px-4 py-3">
                    {w.partner_name} <span className="text-xs text-slate-500">({w.partner_code})</span>
                  </td>
                  <td className="px-4 py-3">{formatMoney(w.amount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {w.momo_operator} — {w.momo_phone} ({w.momo_country_code})
                  </td>
                  <td className="px-4 py-3">
                    <WithdrawalActions row={w} />
                  </td>
                </tr>
              ))}
              {pendingWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Aucun retrait en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ListPageShell>
  );
}
