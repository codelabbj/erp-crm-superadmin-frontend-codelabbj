import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ChevronUp,
  Flag,
  FileSearch,
  Globe,
  LayoutDashboard,
  Moon,
  ReceiptText,
  Rocket,
  ServerCog,
  ShieldBan,
  Puzzle,
  SlidersHorizontal,
  Sun,
  Upload,
  Users2,
  WalletCards,
} from "lucide-react";
import { Dashboard } from "../features/dashboard/Dashboard";
import { Modules } from "../features/modules/Modules";
import { Subscriptions } from "../features/subscriptions/Subscriptions";
import { Organizations } from "../features/organizations/Organizations";
import { Users } from "../features/users/Users";
import { AuditLogs } from "../features/auditLogs/AuditLogs";
import { BillingOps } from "../features/billingOps/BillingOps";
import { DataOps } from "../features/dataOps/DataOps";
import type { Tab } from "../lib/ui";
import { authApi } from "../lib/api";
import { applyTheme, getInitialTheme, type ThemeMode } from "../lib/theme";

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
  type MenuSection =
    | "overview"
    | "tenants"
    | "revenue"
    | "platformOps"
    | "security";

  const sectionByTab: Record<Tab, MenuSection> = {
    overview: "overview",
    platformHealth: "overview",
    businessMetrics: "overview",
    organizations: "tenants",
    onboarding: "tenants",
    domainsSsl: "tenants",
    subscriptions: "revenue",
    plansFeatures: "revenue",
    invoices: "revenue",
    featureFlags: "platformOps",
    modules: "platformOps",
    backgroundJobs: "platformOps",
    staffUsers: "platformOps",
    auditLogs: "security",
    bannedIpsWaf: "security",
    billingOps: "revenue",
    dataOps: "platformOps",
  };
  const [expandedSection, setExpandedSection] = useState<MenuSection | null>(null);
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
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

  const navBtn = (isActive: boolean) =>
    `mb-1 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
      isActive
        ? "border-brand-purple-200 bg-white text-brand-purple-700 shadow-sm dark:border-brand-purple-700 dark:bg-slate-800 dark:text-brand-magenta-500"
        : "border-transparent bg-transparent text-slate-500 hover:bg-white hover:text-brand-purple-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    }`;
  const sectionTriggerBtn = (isOpen: boolean) =>
    `mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
      isOpen
        ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        : "text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    }`;
  const sectionContent = (isOpen: boolean) =>
    `overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
      isOpen ? "visible max-h-96 opacity-100" : "invisible max-h-0 opacity-0 pointer-events-none"
    }`;

  const activeSection = sectionByTab[tab];
  const isSectionOpen = (section: MenuSection) => section === activeSection || section === expandedSection;

  const toggleSection = (section: MenuSection) => {
    if (section === activeSection) return;
    setExpandedSection((current) => (current === section ? null : section));
  };

  useEffect(() => {
    setExpandedSection((current) => (current === activeSection ? null : current));
  }, [activeSection]);

  return (
    <div className="min-h-screen">
      <aside className="fixed top-0 left-0 bottom-0 w-72 overflow-y-auto border-r border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-4 px-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Super Admin</h2>
        <div className="mb-4">
          <button type="button" className={sectionTriggerBtn(isSectionOpen("overview"))} onClick={() => toggleSection("overview")}>
            <span>Vue d&apos;ensemble</span>
            {isSectionOpen("overview") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={sectionContent(isSectionOpen("overview"))}>
            <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
              <button className={navBtn(tab === "overview")} onClick={() => setTab("overview")}>
                <LayoutDashboard size={16} />
                Vue d&apos;ensemble
              </button>
              <button className={navBtn(tab === "platformHealth")} onClick={() => setTab("platformHealth")}>
                <ServerCog size={16} />
                Sante de la plateforme
              </button>
              <button className={navBtn(tab === "businessMetrics")} onClick={() => setTab("businessMetrics")}>
                <BarChart3 size={16} />
                Metriques business
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button type="button" className={sectionTriggerBtn(isSectionOpen("tenants"))} onClick={() => toggleSection("tenants")}>
            <span>Gestion des tenants</span>
            {isSectionOpen("tenants") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={sectionContent(isSectionOpen("tenants"))}>
            <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
              <button className={navBtn(tab === "organizations")} onClick={() => setTab("organizations")}>
                <Building2 size={16} />
                Organisations
              </button>
              <button className={navBtn(tab === "onboarding")} onClick={() => setTab("onboarding")}>
                <Rocket size={16} />
                Onboarding
              </button>
              <button className={navBtn(tab === "domainsSsl")} onClick={() => setTab("domainsSsl")}>
                <Globe size={16} />
                Domaines & SSL
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button type="button" className={sectionTriggerBtn(isSectionOpen("revenue"))} onClick={() => toggleSection("revenue")}>
            <span>Revenus & plans</span>
            {isSectionOpen("revenue") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={sectionContent(isSectionOpen("revenue"))}>
            <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
              <button className={navBtn(tab === "subscriptions")} onClick={() => setTab("subscriptions")}>
                <WalletCards size={16} />
                Abonnements
              </button>
              <button className={navBtn(tab === "plansFeatures")} onClick={() => setTab("plansFeatures")}>
                <SlidersHorizontal size={16} />
                Plans & fonctionnalites
              </button>
              <button className={navBtn(tab === "invoices")} onClick={() => setTab("invoices")}>
                <ReceiptText size={16} />
                Factures
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button type="button" className={sectionTriggerBtn(isSectionOpen("platformOps"))} onClick={() => toggleSection("platformOps")}>
            <span>Operations plateforme</span>
            {isSectionOpen("platformOps") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={sectionContent(isSectionOpen("platformOps"))}>
            <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
              <button className={navBtn(tab === "featureFlags")} onClick={() => setTab("featureFlags")}>
                <Flag size={16} />
                Feature flags
              </button>
              <button className={navBtn(tab === "modules")} onClick={() => setTab("modules")}>
                <Puzzle size={16} />
                Modules
              </button>
              <button className={navBtn(tab === "backgroundJobs")} onClick={() => setTab("backgroundJobs")}>
                <Upload size={16} />
                Jobs en arriere-plan
              </button>
              <button className={navBtn(tab === "staffUsers")} onClick={() => setTab("staffUsers")}>
                <Users2 size={16} />
                Utilisateurs staff
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button type="button" className={sectionTriggerBtn(isSectionOpen("security"))} onClick={() => toggleSection("security")}>
            <span>Securite & conformite</span>
            {isSectionOpen("security") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={sectionContent(isSectionOpen("security"))}>
            <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
              <button className={navBtn(tab === "auditLogs")} onClick={() => setTab("auditLogs")}>
                <FileSearch size={16} />
                Journaux d&apos;audit
              </button>
              <button className={navBtn(tab === "bannedIpsWaf")} onClick={() => setTab("bannedIpsWaf")}>
                <ShieldBan size={16} />
                IP bannies / WAF
              </button>
            </div>
          </div>
        </div>
        <button
          className="mt-2 inline-flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-brand-purple-300 hover:text-brand-purple-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          onClick={refreshAllData}
          disabled={isRefreshing}
        >
          <Boxes size={16} />
          {isRefreshing ? "Rafraichissement..." : "Rafraichir"}
        </button>
      </aside>
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
          {tab === "overview" && <Dashboard />}
          {tab === "modules" && <Modules />}
          {tab === "subscriptions" && <Subscriptions />}
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
          {tab === "domainsSsl" && (
            <ComingSoonPanel
              title="Domains & SSL"
              description="Gestion CNAME et certificats en attente d'endpoints backend dedies."
            />
          )}
          {tab === "plansFeatures" && (
            <ComingSoonPanel
              title="Plans & Features"
              description="Moteur quotas/entitlements et edition des plans: en attente de modeles backend."
            />
          )}
          {tab === "featureFlags" && (
            <ComingSoonPanel
              title="Feature Flags"
              description="Deploiement progressif et toggles tenant: en attente d'une API flags globale."
            />
          )}
          {tab === "bannedIpsWaf" && (
            <ComingSoonPanel
              title="Banned IPs / WAF"
              description="Blocage global IP et regles WAF a venir des que le backend securite est expose."
            />
          )}
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
