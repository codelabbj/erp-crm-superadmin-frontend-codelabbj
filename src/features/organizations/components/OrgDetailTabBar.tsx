import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  WalletCards,
  Users,
  Receipt,
  CreditCard,
  Server,
  Handshake,
  Coins,
} from "lucide-react";
import type { OrgDetailTab } from "@/lib/orgNavigation";
import { cn } from "@/lib/utils";

export const ORG_DETAIL_TABS: {
  id: OrgDetailTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: "overview", label: "Aperçu", shortLabel: "Aperçu", icon: LayoutDashboard },
  { id: "subscriptions", label: "Abonnement", shortLabel: "Abonn.", icon: WalletCards },
  { id: "team", label: "Équipe & propriétaire", shortLabel: "Équipe", icon: Users },
  { id: "billing", label: "Facturation", shortLabel: "Factures", icon: Receipt },
  { id: "credits", label: "Crédits", shortLabel: "Crédits", icon: Coins },
  { id: "payments", label: "Transactions PAL", shortLabel: "PAL", icon: CreditCard },
  { id: "partner", label: "Partenaire", shortLabel: "Part.", icon: Handshake },
  { id: "deployment", label: "Déploiement", shortLabel: "Déploi.", icon: Server },
];

type Props = {
  active: OrgDetailTab;
  onChange: (tab: OrgDetailTab) => void;
  counts?: Partial<Record<OrgDetailTab, number>>;
};

export function OrgDetailTabBar({ active, onChange, counts }: Props) {
  return (
    <nav
      className="mt-4 -mb-px flex gap-0.5 overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800"
      aria-label="Sections organisation"
    >
      {ORG_DETAIL_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const count = counts?.[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-brand-purple-600 bg-brand-purple-50/80 text-brand-purple-800 dark:border-brand-purple-400 dark:bg-brand-purple-900/25 dark:text-brand-purple-200"
                : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
            )}
          >
            <Icon size={15} className={isActive ? "text-brand-purple-600 dark:text-brand-purple-400" : ""} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {count != null && count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-brand-purple-200 text-brand-purple-900 dark:bg-brand-purple-800 dark:text-brand-purple-100"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
