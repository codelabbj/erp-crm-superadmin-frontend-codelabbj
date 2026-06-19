import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  FileSearch,
  Flag,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Puzzle,
  ReceiptText,
  Rocket,
  Scale,
  ServerCog,
  ShieldBan,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users2,
  WalletCards,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  end?: boolean;
}

export interface NavSection {
  sectionKey: string;
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: "overview",
    title: "Vue d'ensemble",
    items: [
      { icon: LayoutDashboard, label: "Tableau de bord", path: "/", end: true },
      { icon: ServerCog, label: "Santé plateforme", path: "/platform-health" },
      { icon: BarChart3, label: "Métriques business", path: "/business-metrics" },
    ],
  },
  {
    sectionKey: "tenants",
    title: "Tenants",
    items: [
      { icon: Building2, label: "Organisations", path: "/organizations" },
      { icon: Rocket, label: "Onboarding", path: "/onboarding" },
    ],
  },
  {
    sectionKey: "revenue",
    title: "Revenus & plans",
    items: [
      { icon: WalletCards, label: "Abonnements", path: "/subscriptions" },
      { icon: BarChart3, label: "Stats abonnements", path: "/subscriptions/stats" },
      { icon: FileSearch, label: "Alertes abonnements", path: "/subscriptions/alerts" },
      { icon: SlidersHorizontal, label: "Plans & fonctionnalités", path: "/plans" },
      { icon: ReceiptText, label: "Factures", path: "/billing/invoices" },
    ],
  },
  {
    sectionKey: "platform",
    title: "Plateforme",
    items: [
      { icon: Flag, label: "Feature flags", path: "/platform/feature-flags" },
      { icon: Puzzle, label: "Modules", path: "/platform/modules" },
      { icon: Upload, label: "Jobs arrière-plan", path: "/platform/jobs" },
      { icon: Users2, label: "Utilisateurs staff", path: "/platform/staff" },
    ],
  },
  {
    sectionKey: "security",
    title: "Sécurité",
    items: [
      { icon: FileSearch, label: "Journaux d'audit", path: "/security/audit-logs" },
      { icon: ShieldBan, label: "IP bannies / WAF", path: "/security/waf" },
    ],
  },
  {
    sectionKey: "business",
    title: "Modules métier",
    items: [
      { icon: Megaphone, label: "Marketing", path: "/business/marketing" },
      { icon: LifeBuoy, label: "Support / Tickets", path: "/business/support" },
      { icon: Briefcase, label: "Projets", path: "/business/projects" },
      { icon: ShoppingCart, label: "E-commerce", path: "/business/ecommerce" },
      { icon: Scale, label: "Fiscalité", path: "/business/fiscal" },
    ],
  },
  {
    sectionKey: "intelligence",
    title: "Intelligence",
    items: [{ icon: Sparkles, label: "Assistant IA", path: "/intelligence/ai" }],
  },
];
