import { useState } from "react";
import { Search, Building2, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/adminApi";

export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: orgs } = useQuery({
    queryKey: ["search-orgs", query],
    queryFn: () => adminApi.organizations({ q: query, limit: 5 }),
    enabled: query.length > 2,
  });

  const { data: users } = useQuery({
    queryKey: ["search-users", query],
    queryFn: () => adminApi.users({ q: query, limit: 5 }),
    enabled: query.length > 2,
  });

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher une organisation ou un utilisateur..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-purple-400 focus:ring-2 focus:ring-brand-purple-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-purple-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query.length > 2 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {/* Organizations */}
            <div className="mb-2">
              <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Organisations</h4>
              {orgs?.results?.length ? (
                orgs.results.map((org) => (
                  <button
                    key={org.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="rounded-md bg-brand-purple-50 p-1.5 text-brand-purple-600 dark:bg-brand-purple-900/30">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{org.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{org.slug}.erp</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-slate-500">Aucune organisation trouvée</p>
              )}
            </div>

            {/* Users */}
            <div>
              <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilisateurs</h4>
              {users?.results?.length ? (
                users.results.map((user) => (
                  <button
                    key={user.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="rounded-md bg-brand-magenta-50 p-1.5 text-brand-magenta-600 dark:bg-brand-magenta-900/30">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-slate-500">Aucun utilisateur trouvé</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              className="w-full rounded-md py-1.5 text-center text-xs font-medium text-slate-500 hover:text-brand-purple-600"
              onClick={() => setIsOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
