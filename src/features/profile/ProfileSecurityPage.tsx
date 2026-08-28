import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Timer, KeyRound } from "lucide-react";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/ui";
import { ListPageShell, PageHeader } from "@/components/ui/PageHeader";

const IDLE_OPTIONS: { value: number; label: string }[] = [
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 1800, label: "30 minutes" },
  { value: 3600, label: "1 heure" },
  { value: 14400, label: "4 heures" },
  { value: 86400, label: "24 heures" },
  { value: 604800, label: "7 jours" },
];

const REAUTH_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "À chaque connexion" },
  { value: 3600, label: "Toutes les heures" },
  { value: 86400, label: "Toutes les 24 h" },
  { value: 604800, label: "Toutes les semaines" },
];

export function ProfileSecurityPage() {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
  });

  const { data: otp } = useQuery({
    queryKey: ["security-otp"],
    queryFn: async () => (await authApi.getSecurityOtp()).data,
  });

  const [idle, setIdle] = useState(3600);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [reauth, setReauth] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (me?.user?.console_idle_timeout_seconds) setIdle(me.user.console_idle_timeout_seconds);
  }, [me?.user?.console_idle_timeout_seconds]);

  useEffect(() => {
    if (otp) {
      setOtpEnabled(Boolean(otp.enabled));
      setReauth(Number(otp.reauth_period_seconds ?? 0));
    }
  }, [otp]);

  const saveIdle = useMutation({
    mutationFn: () => authApi.patchConsolePreferences({ console_idle_timeout_seconds: idle }),
    onSuccess: async () => {
      setFeedback("Délai d'inactivité enregistré.");
      setError("");
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const saveOtp = useMutation({
    mutationFn: () =>
      authApi.patchSecurityOtp({ enabled: otpEnabled, reauth_period_seconds: reauth }),
    onSuccess: async () => {
      setFeedback("Paramètres OTP enregistrés.");
      setError("");
      await qc.invalidateQueries({ queryKey: ["security-otp"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      setFeedback("Mot de passe mis à jour.");
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  return (
    <ListPageShell>
      <PageHeader
        title="Mon profil / sécurité"
        description="2FA e-mail et expiration de session pour votre compte console."
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="m-0 font-semibold text-slate-800 dark:text-slate-100">{me?.user?.full_name}</p>
        <p className="m-0 text-slate-500">{me?.user?.email}</p>
        <p className="m-0 mt-1 text-xs text-slate-400">
          Rôle : {me?.user?.platform_role || (me?.user?.is_superuser ? "owner" : "—")}
        </p>
      </div>

      {feedback ? <p className="mb-3 text-xs text-emerald-600">{feedback}</p> : null}
      {error ? <p className="mb-3 text-xs text-red-600">{error}</p> : null}

      {me?.user?.platform_role === "owner" || me?.user?.is_superuser ? (
        <section className="mb-5 rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <KeyRound size={15} /> Mot de passe (Owner)
          </h3>
          <form
            className="grid max-w-md gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (newPassword.length < 8) {
                setError("Nouveau mot de passe : 8 caractères minimum.");
                return;
              }
              changePassword.mutate();
            }}
          >
            <label className="text-xs text-slate-600 dark:text-slate-300">
              Mot de passe actuel
              <input
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">
              Nouveau mot de passe
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-600 dark:text-slate-300">
              Confirmer
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary w-fit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Enregistrement…" : "Changer le mot de passe"}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            Mot de passe perdu ?{" "}
            <a href="/owner/forgot-password" className="text-brand-purple-600 hover:underline">
              Récupération Owner par e-mail
            </a>
          </p>
        </section>
      ) : (
        <section className="mb-5 rounded-2xl border border-border-soft bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Pour changer votre mot de passe, contactez l&apos;Owner — il peut vous envoyer un lien depuis{" "}
          <strong>Équipe console</strong>.
        </section>
      )}

      <section className="mb-5 rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Shield size={15} /> Authentification OTP e-mail
        </h3>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={otpEnabled} onChange={(e) => setOtpEnabled(e.target.checked)} />
          Exiger un code OTP à la connexion
        </label>
        <label className="mb-3 block text-xs text-slate-600 dark:text-slate-300">
          Fréquence de re-challenge
          <select
            className="mt-1 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={reauth}
            onChange={(e) => setReauth(Number(e.target.value))}
          >
            {REAUTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary" disabled={saveOtp.isPending} onClick={() => saveOtp.mutate()}>
          {saveOtp.isPending ? "Enregistrement…" : "Enregistrer OTP"}
        </button>
      </section>

      <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Timer size={15} /> Expiration de session (inactivité)
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Déconnexion automatique si aucune activité. Minimum recommandé : 5 minutes.
        </p>
        <label className="mb-3 block text-xs text-slate-600 dark:text-slate-300">
          Délai
          <select
            className="mt-1 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={idle}
            onChange={(e) => setIdle(Number(e.target.value))}
          >
            {IDLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary" disabled={saveIdle.isPending} onClick={() => saveIdle.mutate()}>
          {saveIdle.isPending ? "Enregistrement…" : "Enregistrer le délai"}
        </button>
      </section>
    </ListPageShell>
  );
}
