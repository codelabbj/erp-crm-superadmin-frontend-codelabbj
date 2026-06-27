import { useEffect, type ReactNode } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirmer l'action",
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  danger = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, isConfirming]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isConfirming) onCancel();
      }}
    >
      <div className="grid w-[min(92vw,460px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h4 id="confirm-dialog-title" className="m-0 text-base font-semibold text-brand-purple-900 dark:text-slate-100">
          {title}
        </h4>
        <div className="m-0 text-sm text-gray-700 dark:text-slate-300">{description}</div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-magenta"}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Application..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
