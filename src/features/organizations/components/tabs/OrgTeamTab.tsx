import { useState } from "react";
import { Crown, Mail, UserPlus } from "lucide-react";
import type { AdminUser } from "@/lib/adminApi";
import { formatIsoDate } from "@/lib/ui";
import { OrgUserActions } from "@/features/organizations/components/OrgUserActions";

type Props = {
  orgId: string;
  owner: AdminUser | null | undefined;
  users: AdminUser[];
};

function UserBadges({ user }: { user: AdminUser }) {
  return (
    <div className="flex flex-wrap gap-1">
      {user.is_owner ? (
        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          <Crown size={10} /> Propriétaire
        </span>
      ) : null}
      {user.is_superuser ? (
        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
          Super Admin
        </span>
      ) : user.is_staff ? (
        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
          Staff
        </span>
      ) : (
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Membre
        </span>
      )}
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
          user.is_active
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        }`}
      >
        {user.is_active ? "Actif" : "Inactif"}
      </span>
      {user.is_approved_by_admin === false ? (
        <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          En attente
        </span>
      ) : null}
    </div>
  );
}

export function OrgTeamTab({ orgId, owner, users }: Props) {
  const [feedback, setFeedback] = useState("");
  const displayOwner = owner ?? users.find((u) => u.is_owner) ?? users[0] ?? null;
  const members = users.filter((u) => !displayOwner || u.id !== displayOwner.id);

  return (
    <div className="grid gap-6">
      {feedback ? (
        <p className="m-0 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {feedback}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900">
        <div className="border-b border-amber-100 px-5 py-3 dark:border-amber-900/30">
          <h3 className="m-0 flex items-center gap-2 text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-300">
            <Crown size={14} /> Propriétaire de l&apos;organisation
          </h3>
        </div>
        {displayOwner ? (
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-lg font-bold text-white shadow-md">
                {(displayOwner.full_name || displayOwner.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="m-0 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {displayOwner.full_name || "—"}
                </p>
                <p className="m-0 mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                  <Mail size={13} /> {displayOwner.email}
                </p>
                <p className="m-0 mt-2 text-xs text-slate-400">
                  Compte créé {formatIsoDate(displayOwner.created_at)}
                </p>
                <div className="mt-2">
                  <UserBadges user={displayOwner} />
                </div>
              </div>
            </div>
            <OrgUserActions user={displayOwner} orgId={orgId} onFeedback={setFeedback} />
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Aucun propriétaire identifié pour cette organisation.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="m-0 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Membres ({users.length})
          </h3>
          <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled title="Bientôt disponible">
            <UserPlus size={14} className="mr-1 inline" /> Inviter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800/40">
              <tr>
                <th className="px-5 py-3 text-left">Utilisateur</th>
                <th className="px-5 py-3 text-left">Rôles</th>
                <th className="px-5 py-3 text-left">Créé</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3">
                    <p className="m-0 font-semibold text-slate-900 dark:text-slate-100">{user.full_name || "—"}</p>
                    <p className="m-0 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <UserBadges user={user} />
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{formatIsoDate(user.created_at)}</td>
                  <td className="px-5 py-3">
                    <OrgUserActions user={user} orgId={orgId} compact onFeedback={setFeedback} />
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400">
                    {users.length <= 1 ? "Aucun autre membre." : "Aucun membre."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
