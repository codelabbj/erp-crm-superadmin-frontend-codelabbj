import { useCallback, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type ConfirmOptions = {
  title?: string;
  description: ReactNode;
  confirmText?: string;
  danger?: boolean;
  action: () => void;
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);

  const ask = useCallback((options: ConfirmOptions) => {
    setPending(options);
  }, []);

  const close = useCallback(() => setPending(null), []);

  const renderDialog = (isConfirming = false) => (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending?.title}
      description={pending?.description ?? ""}
      confirmText={pending?.confirmText}
      danger={pending?.danger}
      isConfirming={isConfirming}
      onCancel={close}
      onConfirm={() => {
        pending?.action();
      }}
    />
  );

  return { ask, close, renderDialog };
}
