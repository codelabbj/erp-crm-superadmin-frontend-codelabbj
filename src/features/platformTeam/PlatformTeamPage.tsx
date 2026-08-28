import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { adminApi, type PlatformRole } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";

const ROLES: { value: PlatformRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "ops", label: "Ops" },
  { value: "support", label: "Support" },
  { value: "viewer", label: "Viewer" },
];

export function PlatformTeamPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PlatformRole>("ops");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ["platform-staff"],
    queryFn: () => adminApi.platformStaff(),
  });

  const inviteMut = useMutation({
    mutationFn: () => adminApi.invitePlatformStaff({ email, role, full_name: fullName || undefined }),
    onSuccess: async () => {
      setFeedback(`Invitation envoyée à ${email}.`);
      setError("");
      setEmail("");
      setFullName("");
      await qc.invalidateQueries({ queryKey: ["platform-staff"] });
    },
    onError: (e) => {
      setFeedback("");
      setError(getErrorMessage(e));
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => adminApi.revokePlatformStaff(id),
    onSuccess: async () => {
      setFeedback("Accès révoqué.");
      await qc.invalidateQueries({ queryKey: ["platform-staff"] });
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const patchMut = useMutation({
    mutationFn: (args: { id: string; role: string }) => adminApi.patchPlatformStaff(args.id, { role: args.role }),
    onSuccess: async () => {
      setFeedback("Rôle mis à jour.");
      await qc.invalidateQueries({ queryKey: ["platform-staff"] });
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => adminApi.resendPlatformStaffInvite(id),
    onSuccess: () => setFeedback("Invitation renvoyée."),
    onError: (e) => setError(getErrorMessage(e)),
  });

  return (
    <ListPageShell>
      <PageHeader
        title="Équipe console"
        description="Inviter et gérer les accès Super Admin (Owner, Ops, Support, Viewer)."
      />

      <section className="mb-6 rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <UserPlus size={16} /> Inviter un membre
        </h3>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            inviteMut.mutate();
          }}
        >
          <label className="text-xs text-slate-600 dark:text-slate-300">
            E-mail
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Nom (optionnel)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Rôle
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={role}
              onChange={(e) => setRole(e.target.value as PlatformRole)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={inviteMut.isPending}>
              {inviteMut.isPending ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
        {feedback ? <p className="mt-2 text-xs text-emerald-600">{feedback}</p> : null}
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      {isLoading ? <p className="text-sm text-slate-500">Chargement…</p> : null}
      {isError ? <p className="text-sm text-red-600">{getErrorMessage(loadError)}</p> : null}

      <section className="mb-6 overflow-x-auto rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h3 className="m-0 flex items-center gap-2 text-sm font-semibold">
            <Shield size={15} /> Membres actifs
          </h3>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Membre</th>
              <th className="px-4 py-2">Rôle</th>
              <th className="px-4 py-2">OTP</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((m) => (
              <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <p className="m-0 font-medium text-slate-800 dark:text-slate-100">{m.full_name || "—"}</p>
                  <p className="m-0 text-xs text-slate-500">{m.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                    value={m.role}
                    onChange={(e) => patchMut.mutate({ id: m.id, role: e.target.value })}
                    disabled={!m.is_active || patchMut.isPending}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs">{m.email_otp_enabled ? "Oui" : "Non"}</td>
                <td className="px-4 py-3 text-xs">{m.is_active ? "Actif" : "Révoqué"}</td>
                <td className="px-4 py-3">
                  {m.is_active ? (
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs text-red-700"
                      disabled={revokeMut.isPending}
                      onClick={() => {
                        if (window.confirm(`Révoquer l'accès de ${m.email} ?`)) revokeMut.mutate(m.id);
                      }}
                    >
                      Révoquer
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {(data?.pending_invites?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold">Invitations en attente</h3>
          <ul className="m-0 grid gap-2 p-0 list-none">
            {data!.pending_invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
              >
                <span>
                  {inv.email} · <strong>{inv.role}</strong>
                </span>
                <button
                  type="button"
                  className="btn-secondary px-2 py-1 text-xs"
                  disabled={resendMut.isPending}
                  onClick={() => resendMut.mutate(inv.id)}
                >
                  Renvoyer
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ListPageShell>
  );
}
