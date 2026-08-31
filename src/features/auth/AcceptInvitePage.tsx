import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <label htmlFor={id} className="text-sm">
      {label}
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn-ghost absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={onToggleVisible}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [fullName, setFullName] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const validate = useQuery({
    queryKey: ["platform-invite", token],
    queryFn: () => adminApi.validatePlatformStaffInvite(token),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (validate.data?.full_name) setFullName(validate.data.full_name);
  }, [validate.data?.full_name]);

  const accept = useMutation({
    mutationFn: () => adminApi.acceptPlatformStaffInvite({ token, password, full_name: fullName || undefined }),
    onSuccess: () => {
      setDone(true);
      setError("");
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  if (!token) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-bg p-4">
        <p className="text-sm text-red-600">Lien d&apos;invitation invalide (token manquant).</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-bg p-4 dark:bg-slate-950">
      <div className="w-[min(96vw,440px)] rounded-2xl border border-border-soft bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h1 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">Activer mon accès</h1>
        <p className="mt-1 text-sm text-slate-500">Console Super Admin OwoDesk</p>

        {validate.isLoading ? <p className="mt-4 text-sm text-slate-500">Vérification…</p> : null}
        {validate.isError ? (
          <p className="mt-4 text-sm text-red-600">{getErrorMessage(validate.error)}</p>
        ) : null}

        {validate.data && !done ? (
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
              accept.mutate();
            }}
          >
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
              Compte <strong>{validate.data.email}</strong> · rôle <strong>{validate.data.role}</strong>
            </p>
            <label className="text-sm">
              Nom complet
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <PasswordInput
              id="invite-password"
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
            />
            <PasswordInput
              id="invite-password-confirm"
              label="Confirmer"
              value={password2}
              onChange={setPassword2}
              visible={showPassword2}
              onToggleVisible={() => setShowPassword2((v) => !v)}
            />
            {error ? <p className="m-0 text-xs text-red-600">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={accept.isPending}>
              {accept.isPending ? "Activation…" : "Activer mon compte"}
            </button>
          </form>
        ) : null}

        {done ? (
          <div className="mt-4 grid gap-3">
            <p className="m-0 text-sm text-emerald-700">Compte activé. Vous pouvez vous connecter.</p>
            <Link to="/login" className="btn-primary text-center">
              Aller à la connexion
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
