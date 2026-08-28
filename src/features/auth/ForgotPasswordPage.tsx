import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/ui";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const request = useMutation({
    mutationFn: () => authApi.requestPasswordReset(email.trim().toLowerCase()),
    onSuccess: () => {
      setSent(true);
      setError("");
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  return (
    <div className="grid min-h-screen place-items-center bg-surface-bg p-4 dark:bg-slate-950">
      <div className="w-[min(96vw,440px)] rounded-2xl border border-border-soft bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h1 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Récupération Owner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Réservé au compte <strong>Owner</strong> de la console. Les autres membres doivent contacter l&apos;Owner.
        </p>

        {sent ? (
          <div className="mt-4 grid gap-3">
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
              Si le compte Owner actif correspond à <strong>{email}</strong>, un e-mail de réinitialisation vient
              d&apos;être envoyé (lien valide 24 h). Vérifiez aussi les spams.
            </p>
            <Link to="/login" className="btn-primary text-center">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              request.mutate();
            }}
          >
            <label className="text-sm">
              E-mail du compte Owner
              <input
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? <p className="m-0 text-xs text-red-600">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={request.isPending}>
              {request.isPending ? "Envoi…" : "Envoyer le lien"}
            </button>
            <Link to="/login" className="text-center text-sm text-brand-purple-600 hover:underline">
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
