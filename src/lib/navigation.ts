import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  FileSearch,
  Flag,
  Handshake,
  LayoutDashboard,
  Package,
  Puzzle,
  Rocket,
  ShieldBan,
  SlidersHorizontal,
  Upload,
  Users2,
  WalletCards,
  Coins,
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

/** Navigation unique — menu condensé (détails sur fiche org, onglets abonnements, liens dashboard). */
export const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: "overview",
    title: "Vue d'ensemble",
    items: [{ icon: LayoutDashboard, label: "Tableau de bord", path: "/", end: true }],
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
    title: "Revenus",
    items: [
      { icon: WalletCards, label: "Abonnements", path: "/subscriptions" },
      { icon: CreditCard, label: "Transactions PAL", path: "/payment-transactions" },
      { icon: Handshake, label: "Partenaires", path: "/partners" },
      { icon: SlidersHorizontal, label: "Plans & fonctionnalités", path: "/plans" },
      { icon: Coins, label: "Catalogue crédits", path: "/credits-catalog" },
    ],
  },
  {
    sectionKey: "platform",
    title: "Plateforme",
    items: [
      { icon: Package, label: "Produits", path: "/catalog/products" },
      { icon: Puzzle, label: "Modules", path: "/platform/modules" },
      { icon: Users2, label: "Utilisateurs staff", path: "/platform/staff" },
      { icon: Flag, label: "Feature flags", path: "/platform/feature-flags" },
      { icon: Upload, label: "Jobs arrière-plan", path: "/platform/jobs" },
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
];

/** @deprecated Utiliser NAV_SECTIONS */
export const NAV_SECTIONS_MAIN = NAV_SECTIONS;
export const NAV_SECTIONS_FOOTER: NavSection[] = [];
