import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/ui";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const validate = useQuery({
    queryKey: ["reset-password", token],
    queryFn: async () => (await authApi.validatePasswordResetToken(token)).data,
    enabled: Boolean(token),
    retry: false,
  });

  const reset = useMutation({
    mutationFn: () => authApi.setPasswordFromToken(token, password),
    onSuccess: () => {
      setDone(true);
      setError("");
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-bg p-4">
        <p className="text-sm text-red-600">Lien invalide (token manquant).</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-bg p-4 dark:bg-slate-950">
      <div className="w-[min(96vw,440px)] rounded-2xl border border-border-soft bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h1 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-slate-500">Console Super Admin OwoDesk</p>

        {validate.isLoading ? <p className="mt-4 text-sm text-slate-500">Vérification du lien…</p> : null}
        {validate.isError || validate.data?.valid === false ? (
          <div className="mt-4 grid gap-3">
            <p className="m-0 text-sm text-red-600">
              {validate.data?.detail || getErrorMessage(validate.error) || "Lien invalide ou expiré."}
            </p>
            <Link to="/forgot-password" className="btn-secondary text-center">
              Demander un nouveau lien
            </Link>
          </div>
        ) : null}

        {validate.data?.valid && !done ? (
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (password.length < 8) {
                setError("Mot de passe : 8 caractères minimum.");
                return;
              }
              if (password !== password2) {
                setError("Les mots de passe ne correspondent pas.");
                return;
              }
              reset.mutate();
            }}
          >
            {validate.data.email_hint ? (
              <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
                Compte : <strong>{validate.data.email_hint}</strong>
              </p>
            ) : null}
            <label className="text-sm">
              Nouveau mot de passe
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Confirmer
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </label>
            {error ? <p className="m-0 text-xs text-red-600">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={reset.isPending}>
              {reset.isPending ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        ) : null}

        {done ? (
          <div className="mt-4 grid gap-3">
            <p className="m-0 text-sm text-emerald-700">Mot de passe mis à jour. Vous pouvez vous connecter.</p>
            <Link to="/login" className="btn-primary text-center">
              Aller à la connexion
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
