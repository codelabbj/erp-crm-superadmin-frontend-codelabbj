import { useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { authApi } from "@/lib/api";
import { useConsoleIdleTimeout } from "@/hooks/useConsoleIdleTimeout";

const SIDEBAR_KEY = "owo_sa_sidebar_collapsed";

export function DashboardLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "true");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState("");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
  });

  useConsoleIdleTimeout(me?.user?.console_idle_timeout_seconds);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const logout = useCallback(() => {
    localStorage.removeItem("sa_access");
    localStorage.removeItem("sa_refresh");
    navigate("/login", { replace: true });
    window.location.reload();
  }, [navigate]);

  const refreshAllData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshToast("");
    try {
      const keys = [
        ["overview"],
        ["dashboard-orgs"],
        ["dashboard-users"],
        ["dashboard-modules"],
        ["dashboard-subs"],
        ["orgs"],
        ["users"],
        ["modules"],
        ["subs"],
        ["subscription-stats"],
        ["subscription-expiring-soon"],
        ["subscription-alerts"],
        ["me"],
        ["audit-logs"],
        ["billing-clients"],
        ["billing-invoices"],
        ["billing-payments"],
        ["data-imports"],
        ["data-exports"],
      ] as const;
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      setRefreshToast("Données rafraîchies.");
      window.setTimeout(() => setRefreshToast(""), 2200);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div data-owo-dashboard className="flex h-screen w-full overflow-hidden bg-neutral-2">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        userEmail={me?.user?.email}
        userName={me?.user?.full_name}
        meUser={me?.user}
        onLogout={() => setIsLogoutConfirmOpen(true)}
        onRefresh={() => void refreshAllData()}
        isRefreshing={isRefreshing}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={handleToggle} onLogout={() => setIsLogoutConfirmOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 md:px-8 md:py-5">
            <Outlet />
          </div>
        </main>
      </div>

      {refreshToast ? (
        <div className="fixed right-5 bottom-5 z-40 rounded-xl border border-success-2 bg-neutral-0 px-4 py-3 text-sm font-medium text-success-3 shadow-lg">
          {refreshToast}
        </div>
      ) : null}

      {isLogoutConfirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-10/55" role="dialog" aria-modal="true">
          <div className="grid w-[min(92vw,420px)] gap-3 rounded-2xl border border-neutral-4 bg-neutral-0 p-5 shadow-xl">
            <h3 className="m-0 text-lg font-semibold text-neutral-9">Confirmer la déconnexion</h3>
            <p className="m-0 text-sm text-neutral-7">Es-tu sûr de vouloir te déconnecter ?</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-magenta" onClick={logout}>
                Oui, me déconnecter
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsLogoutConfirmOpen(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
