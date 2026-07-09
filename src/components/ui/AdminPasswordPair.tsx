import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type AdminPasswordPairProps = {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  label?: string;
  confirmLabel?: string;
  hint?: string;
  error?: string;
};

function PasswordField({
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
      <span className="mb-1 block font-medium">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 dark:border-slate-700 dark:bg-slate-800"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          onClick={onToggleVisible}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export function AdminPasswordPair({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  label = "Mot de passe portail",
  confirmLabel = "Confirmer le mot de passe",
  hint,
  error,
}: AdminPasswordPairProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="grid gap-3">
      <PasswordField
        id="admin-password"
        label={label}
        value={password}
        onChange={onPasswordChange}
        visible={showPassword}
        onToggleVisible={() => setShowPassword((v) => !v)}
      />
      <PasswordField
        id="admin-password-confirm"
        label={confirmLabel}
        value={confirmPassword}
        onChange={onConfirmChange}
        visible={showConfirm}
        onToggleVisible={() => setShowConfirm((v) => !v)}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {mismatch ? <p className="text-xs text-red-600">Les mots de passe ne correspondent pas.</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function validateAdminPasswordPair(password: string, confirmPassword: string): string | null {
  if (!password) return "Le mot de passe est requis.";
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (password !== confirmPassword) return "Les mots de passe ne correspondent pas.";
  return null;
}
