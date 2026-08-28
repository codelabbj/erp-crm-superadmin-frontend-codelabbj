import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, Lock, Mail, Moon, PanelsTopLeft, ShieldCheck, Sun, X } from "lucide-react";
import { authApi, consumeSaLoginNotice } from "../../lib/api";
import { getErrorMessage } from "../../lib/ui";
import { applyTheme, getInitialTheme, type ThemeMode } from "../../lib/theme";

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("sa_access")) {
      navigate("/", { replace: true });
      return;
    }
    const notice = consumeSaLoginNotice();
    if (notice) setToastMessage(notice);
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const finishLogin = async (access: string, refresh: string) => {
    localStorage.setItem("sa_access", access);
    localStorage.setItem("sa_refresh", refresh);
    const me = await authApi.me();
    if (!me.data.user.can_access_console && !me.data.user.is_superuser) {
      localStorage.removeItem("sa_access");
      localStorage.removeItem("sa_refresh");
      throw new Error("Ce compte n'a pas accès à la console Super Admin.");
    }
  };

  const login = useMutation({
    mutationFn: async () => {
      const { data } = await authApi.login(email, password);
      if (data.otp_required && data.challenge_id) {
        setOtpChallengeId(data.challenge_id);
        setOtpHint(data.email_hint || "");
        return { otp: true as const };
      }
      if (!data.access || !data.refresh) throw new Error("Réponse login invalide.");
      await finishLogin(data.access, data.refresh);
      return { otp: false as const };
    },
    onSuccess: (result) => {
      if (!result.otp) navigate("/", { replace: true });
    },
    onError: (e) => {
      const maybeAxios = e as { response?: { data?: { detail?: string } } };
      const apiMessage = maybeAxios?.response?.data?.detail;
      setToastMessage(
        typeof apiMessage === "string" ? apiMessage : getErrorMessage(e) || "Connexion impossible",
      );
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      if (!otpChallengeId) throw new Error("Challenge OTP manquant.");
      const { data } = await authApi.verifyOtp(otpChallengeId, otpCode.trim());
      await finishLogin(data.access, data.refresh);
    },
    onSuccess: () => navigate("/", { replace: true }),
    onError: (e) => setToastMessage(getErrorMessage(e) || "Code OTP invalide"),
  });

  const resendOtp = useMutation({
    mutationFn: async () => {
      if (!otpChallengeId) throw new Error("Challenge OTP manquant.");
      const { data } = await authApi.resendOtp(otpChallengeId);
      setOtpChallengeId(data.challenge_id);
      if (data.email_hint) setOtpHint(data.email_hint);
    },
    onSuccess: () => setToastMessage("Nouveau code envoyé."),
    onError: (e) => setToastMessage(getErrorMessage(e)),
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="relative grid min-h-screen bg-surface-bg dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,73,23,0.18),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(224,68,34,0.12),transparent_45%)] dark:opacity-45" />
      <div className="relative grid flex-1 place-items-center px-4 py-12">
        <div className="grid w-[min(96vw,460px)] gap-5 rounded-2xl border border-white/50 bg-white/85 p-7 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex justify-end">
            <button type="button" className="btn-secondary h-9 w-9 p-0" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div className="grid place-items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-purple-700/10 px-3 py-1 text-brand-purple-700">
              <PanelsTopLeft size={16} />
              <span className="text-xl font-semibold">OWO</span>
            </div>
            <h1 className="m-0 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Connexion <span className="text-brand-purple-600 dark:text-brand-purple-500">OWO</span> Admin
            </h1>
            <p className="m-0 text-center text-sm text-text-muted dark:text-slate-400">
              Acces securise a la console d&apos;administration globale.
            </p>
          </div>

          {!otpChallengeId ? (
            <>
              <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Mail size={15} />
                  Adresse e-mail
                </span>
                <input
                  placeholder="admin@codelab.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-gray-300 bg-white/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Lock size={15} />
                  Mot de passe
                </span>
                <div className="group flex h-[46px] items-center rounded-xl border border-gray-300 bg-white/95 px-3 shadow-sm transition focus-within:border-brand-purple-700 focus-within:ring-2 focus-within:ring-brand-purple-700/20 dark:border-slate-600 dark:bg-slate-800/95">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full border-none bg-transparent px-0 py-0 text-sm outline-none ring-0 focus:ring-0 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    className="btn-ghost ml-2 h-7 w-7 p-0"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button
                className="btn-primary py-3 shadow-brand-purple-700/30"
                onClick={() => login.mutate()}
                disabled={login.isPending}
              >
                <ShieldCheck size={16} />
                {login.isPending ? "Connexion..." : "Se connecter"}
              </button>
            </>
          ) : (
            <>
              <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
                Code OTP envoyé à <strong>{otpHint || "votre e-mail"}</strong>
              </p>
              <label className="grid gap-1 text-sm font-medium text-gray-700 dark:text-slate-300">
                Code à 6 chiffres
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="rounded-xl border-gray-300 bg-white/90 px-3 py-2.5 tracking-widest dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <button
                className="btn-primary py-3"
                onClick={() => verifyOtp.mutate()}
                disabled={verifyOtp.isPending || otpCode.trim().length < 4}
              >
                {verifyOtp.isPending ? "Vérification…" : "Valider le code"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={resendOtp.isPending}
                onClick={() => resendOtp.mutate()}
              >
                Renvoyer le code
              </button>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setOtpChallengeId(null);
                  setOtpCode("");
                }}
              >
                Retour
              </button>
            </>
          )}
        </div>
      </div>

      {toastMessage ? (
        <div className="pointer-events-none fixed top-5 right-5 z-50">
          <div className="pointer-events-auto flex w-[min(92vw,460px)] items-start gap-3 rounded-2xl border border-red-200 bg-white/95 p-4 shadow-2xl ring-1 ring-red-100 backdrop-blur-md dark:border-red-400/30 dark:bg-slate-900/95">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold text-red-700 dark:text-red-300">Echec de connexion</p>
              <p className="m-0 mt-1 text-sm text-slate-700 dark:text-slate-200">{toastMessage}</p>
            </div>
            <button type="button" className="btn-ghost h-7 w-7 p-0" onClick={() => setToastMessage("")}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
