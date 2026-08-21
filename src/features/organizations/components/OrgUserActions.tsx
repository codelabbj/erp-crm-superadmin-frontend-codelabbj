import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUser, type AdminUserUpdate } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/ui";

type Props = {
  user: AdminUser;
  orgId: string;
  compact?: boolean;
  onFeedback?: (msg: string) => void;
};

export function OrgUserActions({ user, orgId, compact, onFeedback }: Props) {
  const [pending, setPending] = useState<{ message: string; payload: AdminUserUpdate } | null>(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: async () => {
      onFeedback?.("Utilisateur mis à jour.");
      await qc.invalidateQueries({ queryKey: ["org-related", orgId] });
    },
    onError: (e) => onFeedback?.(getErrorMessage(e)),
  });

  const confirm = (message: string, payload: AdminUserUpdate) => setPending({ message, payload });

  const btn = compact ? "btn-secondary px-2 py-1 text-[11px]" : "btn-secondary px-2.5 py-1.5 text-xs";

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={btn}
          disabled={mut.isPending}
          onClick={() =>
            confirm(
              user.is_active ? "Désactiver cet utilisateur ?" : "Activer cet utilisateur ?",
              { id: user.id, is_active: !user.is_active },
            )
          }
        >
          {user.is_active ? "Désactiver" : "Activer"}
        </button>
        {!user.is_approved_by_admin && !user.is_superuser ? (
          <button
            type="button"
            className={btn}
            disabled={mut.isPending}
            onClick={() =>
              confirm("Approuver ce compte utilisateur ?", { id: user.id, is_approved_by_admin: true })
            }
          >
            Approuver
          </button>
        ) : null}
        <button
          type="button"
          className={btn}
          disabled={mut.isPending}
          onClick={() =>
            confirm(
              user.is_staff ? "Retirer le rôle staff ?" : "Attribuer le rôle staff ?",
              { id: user.id, is_staff: !user.is_staff },
            )
          }
        >
          {user.is_staff ? "Retirer staff" : "Staff"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={mut.isPending}
          onClick={() =>
            confirm(
              user.is_superuser ? "Retirer superuser ?" : "Attribuer superuser ?",
              { id: user.id, is_superuser: !user.is_superuser },
            )
          }
        >
          {user.is_superuser ? "Retirer super" : "Superuser"}
        </button>
      </div>

      {pending ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/55 p-4">
          <div className="grid w-[min(92vw,420px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">Confirmer</h4>
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300">{pending.message}</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPending(null)} disabled={mut.isPending}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-magenta"
                disabled={mut.isPending}
                onClick={() => mut.mutate(pending.payload, { onSettled: () => setPending(null) })}
              >
                {mut.isPending ? "…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
