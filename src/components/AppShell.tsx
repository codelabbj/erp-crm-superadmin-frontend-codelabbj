import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Modules } from "../features/modules/Modules";
import { Subscriptions } from "../features/subscriptions/Subscriptions";
import { Organizations } from "../features/organizations/Organizations";
import { Users } from "../features/users/Users";
import { AuditLogs } from "../features/auditLogs/AuditLogs";
import { BillingOps } from "../features/billingOps/BillingOps";
import { DataOps } from "../features/dataOps/DataOps";
import { Plans } from "../features/plans/Plans";
import { SubscriptionsStats } from "../features/subscriptions/SubscriptionsStats";
import { SubscriptionsAlerts } from "../features/subscriptions/SubscriptionsAlerts";
import { Domains } from "../features/domains/Domains";
import { FeatureFlags } from "../features/featureFlags/FeatureFlags";
import { Security } from "../features/security/Security";
import type { Tab } from "../lib/ui";
import { authApi } from "../lib/api";
import { applyTheme, getInitialTheme, type ThemeMode } from "../lib/theme";
import { Sidebar } from "./Sidebar";

function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="m-0 text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <p className="mt-3 text-xs font-medium text-brand-purple-700 dark:text-brand-magenta-500">Coming soon</p>
    </section>
  );
}

export function AppShell() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState("");
  const [subscriptionsFocusOrgId, setSubscriptionsFocusOrgId] = useState<string | null>(null);
  const clearSubscriptionsFocus = useCallback(() => setSubscriptionsFocusOrgId(null), []);
  const queryClient = useQueryClient();
  const { data: me, isLoading: isMeLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
  });

  const logout = () => {
    localStorage.removeItem("sa_access");
    localStorage.removeItem("sa_refresh");
    window.location.reload();
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isSuperuser = Boolean(me?.user?.is_superuser);

  if (isMeLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-bg dark:bg-slate-950">
        <p className="text-sm text-slate-600 dark:text-slate-300">Verification des droits...</p>
      </div>
    );
  }

  if (me && !isSuperuser) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-bg p-4 dark:bg-slate-950">
        <section className="w-[min(92vw,520px)] rounded-xl border border-border-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="m-0 text-lg font-semibold text-brand-purple-900 dark:text-slate-100">Acces refuse</h2>
          <p className="mt-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
            Cette interface est reservee aux utilisateurs super admin.
          </p>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white"
            onClick={logout}
          >
            Se deconnecter
          </button>
        </section>
      </div>
    );
  }

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
      setRefreshToast("Donnees rafraichies.");
      window.setTimeout(() => setRefreshToast(""), 2200);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar tab={tab} onTabChange={setTab} isRefreshing={isRefreshing} onRefresh={refreshAllData} />
      <main className="ml-72 min-h-screen bg-surface-bg dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-border-soft bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-brand-purple-900 dark:text-slate-100">Console Super Admin</h1>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-gray-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
              onClick={() => setIsUserMenuOpen((v) => !v)}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-br from-brand-purple-700 to-brand-magenta-600 font-semibold text-white">
                {(me?.user?.full_name || me?.user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </button>
            {isUserMenuOpen ? (
              <div className="absolute top-full right-0 mt-2 grid w-60 gap-2 rounded-lg border border-border-soft bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <p className="m-0 text-sm font-semibold dark:text-slate-100">{me?.user?.full_name || "Utilisateur"}</p>
                <p className="m-0 text-xs text-text-muted dark:text-slate-400">{me?.user?.email || "—"}</p>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-2 text-left text-sm transition hover:border-brand-magenta-500 hover:text-brand-purple-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                >
                  Deconnexion
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <section className="grid content-start gap-3 p-[18px]">
          {tab === "overview" && (
            <Dashboard
              onOpenOrgSubscriptions={(orgId) => {
                setSubscriptionsFocusOrgId(orgId);
                setTab("subscriptions");
              }}
              onOpenOrganizationsList={() => setTab("organizations")}
            />
          )}
          {tab === "modules" && <Modules />}
          {tab === "subscriptions" && (
            <Subscriptions focusOrgId={subscriptionsFocusOrgId} onFocusOrgHandled={clearSubscriptionsFocus} />
          )}
          {tab === "subscriptionsStats" && <SubscriptionsStats />}
          {tab === "subscriptionsAlerts" && <SubscriptionsAlerts />}
          {tab === "organizations" && <Organizations />}
          {tab === "staffUsers" && <Users />}
          {tab === "auditLogs" && <AuditLogs />}
          {tab === "invoices" && <BillingOps />}
          {tab === "backgroundJobs" && <DataOps />}
          {tab === "platformHealth" && (
            <ComingSoonPanel
              title="Platform Health"
              description="Latence globale, erreurs et signups du jour seront affiches ici des que les endpoints agreges seront disponibles."
            />
          )}
          {tab === "businessMetrics" && (
            <ComingSoonPanel
              title="Business Metrics"
              description="MRR, ARR et active tenants seront connectes des que les KPI financiers globaux seront exposes."
            />
          )}
          {tab === "onboarding" && (
            <ComingSoonPanel
              title="Onboarding"
              description="Pipeline des tenants en setup/trial a venir des que le backend expose le lifecycle complet."
            />
          )}
          {tab === "domainsSsl" && <Domains />}
          {tab === "plansFeatures" && <Plans />}
          {tab === "featureFlags" && <FeatureFlags />}
          {tab === "bannedIpsWaf" && <Security />}
          {tab === "marketing" && <ComingSoonPanel title="Marketing" description="Gestion des campagnes et contacts marketing via API standard." />}
          {tab === "support" && <ComingSoonPanel title="Support" description="Gestion des tickets et du support client." />}
          {tab === "projects" && <ComingSoonPanel title="Projets" description="Suivi des projets et des tâches globales." />}
          {tab === "ecommerce" && <ComingSoonPanel title="E-commerce" description="Commandes en ligne et catalogue produits web." />}
          {tab === "fiscal" && <ComingSoonPanel title="Fiscalité" description="Configuration et rapports fiscaux." />}
          {tab === "labels" && <ComingSoonPanel title="Étiquettes" description="Gestion des étiquettes et labels plateforme." />}
          {tab === "billingOps" && <BillingOps />}
          {tab === "dataOps" && <DataOps />}
        </section>
      </main>
      {refreshToast ? (
        <div className="fixed right-5 bottom-5 z-40 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg dark:border-emerald-600/30 dark:bg-slate-900 dark:text-emerald-300">
          {refreshToast}
        </div>
      ) : null}
      {isLogoutConfirmOpen ? (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-gray-900/55"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <div className="grid w-[min(92vw,420px)] gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 id="logout-confirm-title" className="m-0 text-lg font-semibold text-brand-purple-900 dark:text-slate-100">
              Confirmer la deconnexion
            </h3>
            <p className="m-0 text-sm text-gray-700 dark:text-slate-300">Es-tu sur de vouloir te deconnecter ?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-brand-magenta-500 bg-brand-magenta-600 px-3 py-2 text-sm text-white"
                onClick={logout}
              >
                Oui, me deconnecter
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                onClick={() => setIsLogoutConfirmOpen(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
