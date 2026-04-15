import { useEffect, useState } from "react";
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
  ReceiptText,
  Rocket,
  ServerCog,
  ShieldBan,
  Puzzle,
  SlidersHorizontal,
  Upload,
  Users2,
  WalletCards,
} from "lucide-react";
import type { Tab } from "../lib/ui";

type MenuSection = "overview" | "tenants" | "revenue" | "platformOps" | "security";

type SidebarProps = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
};

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

export function Sidebar({ tab, onTabChange, isRefreshing, onRefresh }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<MenuSection | null>(null);
  const activeSection = sectionByTab[tab];
  const isSectionOpen = (section: MenuSection) => section === activeSection || section === expandedSection;

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

  const toggleSection = (section: MenuSection) => {
    if (section === activeSection) return;
    setExpandedSection((current) => (current === section ? null : section));
  };

  useEffect(() => {
    setExpandedSection((current) => (current === activeSection ? null : current));
  }, [activeSection]);

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-72 overflow-auto overflow-y-hidden border-r border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="mb-4 px-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Super Admin</h2>
      <div className="mb-4">
        <button type="button" className={sectionTriggerBtn(isSectionOpen("overview"))} onClick={() => toggleSection("overview")}>
          <span>Vue d&apos;ensemble</span>
          {isSectionOpen("overview") ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div className={sectionContent(isSectionOpen("overview"))}>
          <div className="ml-3 border-l border-slate-300 pl-3 dark:border-slate-700">
            <button className={navBtn(tab === "overview")} onClick={() => onTabChange("overview")}>
              <LayoutDashboard size={16} />
              Vue d&apos;ensemble
            </button>
            <button className={navBtn(tab === "platformHealth")} onClick={() => onTabChange("platformHealth")}>
              <ServerCog size={16} />
              Sante de la plateforme
            </button>
            <button className={navBtn(tab === "businessMetrics")} onClick={() => onTabChange("businessMetrics")}>
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
            <button className={navBtn(tab === "organizations")} onClick={() => onTabChange("organizations")}>
              <Building2 size={16} />
              Organisations
            </button>
            <button className={navBtn(tab === "onboarding")} onClick={() => onTabChange("onboarding")}>
              <Rocket size={16} />
              Onboarding
            </button>
            <button className={navBtn(tab === "domainsSsl")} onClick={() => onTabChange("domainsSsl")}>
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
            <button className={navBtn(tab === "subscriptions")} onClick={() => onTabChange("subscriptions")}>
              <WalletCards size={16} />
              Abonnements
            </button>
            <button className={navBtn(tab === "plansFeatures")} onClick={() => onTabChange("plansFeatures")}>
              <SlidersHorizontal size={16} />
              Plans & fonctionnalites
            </button>
            <button className={navBtn(tab === "invoices")} onClick={() => onTabChange("invoices")}>
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
            <button className={navBtn(tab === "featureFlags")} onClick={() => onTabChange("featureFlags")}>
              <Flag size={16} />
              Feature flags
            </button>
            <button className={navBtn(tab === "modules")} onClick={() => onTabChange("modules")}>
              <Puzzle size={16} />
              Modules
            </button>
            <button className={navBtn(tab === "backgroundJobs")} onClick={() => onTabChange("backgroundJobs")}>
              <Upload size={16} />
              Jobs en arriere-plan
            </button>
            <button className={navBtn(tab === "staffUsers")} onClick={() => onTabChange("staffUsers")}>
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
            <button className={navBtn(tab === "auditLogs")} onClick={() => onTabChange("auditLogs")}>
              <FileSearch size={16} />
              Journaux d&apos;audit
            </button>
            <button className={navBtn(tab === "bannedIpsWaf")} onClick={() => onTabChange("bannedIpsWaf")}>
              <ShieldBan size={16} />
              IP bannies / WAF
            </button>
          </div>
        </div>
      </div>

      <button
        className="mt-2 inline-flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-brand-purple-300 hover:text-brand-purple-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <Boxes size={16} />
        {isRefreshing ? "Rafraichissement..." : "Rafraichir"}
      </button>
    </aside>
  );
}
