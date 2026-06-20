import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { formatIsoDate } from "@/lib/ui";
import type { ExtendPlanPayload } from "@/lib/adminApi";

type Props = {
  orgName: string;
  planCode?: string | null;
  currentExpiresAt?: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: ExtendPlanPayload) => Promise<unknown>;
};

const PRESET_DAYS = [
  { label: "+30 jours", value: 30 },
  { label: "+90 jours", value: 90 },
  { label: "+1 an", value: 365 },
];

export function OrgExtendPlanModal({
  orgName,
  planCode,
  currentExpiresAt,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const [mode, setMode] = useState<"days" | "date">("days");
  const [extendDays, setExtendDays] = useState(30);
  const [newEndDate, setNewEndDate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!adminNotes.trim()) {
      setError("Le motif audit est obligatoire.");
      return;
    }
    const payload: ExtendPlanPayload = {
      admin_notes: adminNotes.trim(),
    };
    if (mode === "date") {
      if (!newEndDate) {
        setError("Choisissez une date de fin.");
        return;
      }
      payload.new_end_date = new Date(`${newEndDate}T23:59:59`).toISOString();
    } else {
      if (extendDays < 1) {
        setError("Nombre de jours invalide.");
        return;
      }
      payload.extend_days = extendDays;
    }
    try {
      await onSubmit(payload);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : "Erreur lors de la prolongation.");
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border-soft bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              <CalendarPlus size={20} className="text-brand-purple-600" />
              Prolonger le plan
            </h3>
            <p className="m-0 mt-1 text-sm text-slate-500">{orgName}</p>
            {planCode ? (
              <p className="m-0 mt-1 text-xs text-slate-400">
                Plan <strong>{planCode}</strong>
                {currentExpiresAt ? (
                  <> — expire {formatIsoDate(currentExpiresAt)}</>
                ) : null}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0" aria-label="Fermer">
            ×
          </button>
        </div>

        <label className="mb-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
          Motif / note audit *
          <textarea
            className="input mt-1 w-full"
            rows={2}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Ex. geste commercial, correction erreur facturation, prolongation essai…"
          />
        </label>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            className={`btn-secondary flex-1 text-xs ${mode === "days" ? "ring-2 ring-brand-purple-400" : ""}`}
            onClick={() => setMode("days")}
          >
            Ajouter des jours
          </button>
          <button
            type="button"
            className={`btn-secondary flex-1 text-xs ${mode === "date" ? "ring-2 ring-brand-purple-400" : ""}`}
            onClick={() => setMode("date")}
          >
            Fixer une date
          </button>
        </div>

        {mode === "days" ? (
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESET_DAYS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    extendDays === p.value
                      ? "border-brand-purple-500 bg-brand-purple-50 text-brand-purple-800 dark:bg-brand-purple-900/30 dark:text-brand-purple-200"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => setExtendDays(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Jours à ajouter
              <input
                type="number"
                min={1}
                className="input mt-1 w-full"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </label>
          </div>
        ) : (
          <label className="mb-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Nouvelle date d&apos;expiration
            <input
              type="date"
              className="input mt-1 w-full"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
            />
          </label>
        )}

        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn-magenta" disabled={isPending} onClick={handleSubmit}>
            {isPending ? (
              <>
                <Loader2 className="mr-1 inline animate-spin" size={14} /> Prolongation…
              </>
            ) : (
              "Confirmer la prolongation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
