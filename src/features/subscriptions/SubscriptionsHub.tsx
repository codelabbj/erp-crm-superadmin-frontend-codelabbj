import { Navigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Subscriptions } from "./Subscriptions";
import { SubscriptionsStats } from "./SubscriptionsStats";
import { SubscriptionsAlerts } from "./SubscriptionsAlerts";

const TABS = [
  { id: "list", label: "Gestion plans" },
  { id: "stats", label: "Statistiques" },
  { id: "alerts", label: "Alertes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SubscriptionsHubProps = {
  focusOrgId?: string | null;
  onFocusOrgHandled?: () => void;
};

export function SubscriptionsHub({ focusOrgId, onFocusOrgHandled }: SubscriptionsHubProps) {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabId) || "list";

  const setTab = (id: TabId) => {
    setParams(id === "list" ? {} : { tab: id }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-neutral-4 bg-neutral-1 p-1 dark:bg-neutral-8/40">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-white text-primary-1 shadow-sm dark:bg-neutral-9"
                : "text-neutral-6 hover:text-neutral-9",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <Subscriptions focusOrgId={focusOrgId} onFocusOrgHandled={onFocusOrgHandled} />
      ) : null}
      {tab === "stats" ? <SubscriptionsStats /> : null}
      {tab === "alerts" ? <SubscriptionsAlerts /> : null}
    </div>
  );
}

/** Redirige les anciennes routes vers l'onglet correspondant. */
export function SubscriptionsStatsRedirect() {
  return <Navigate to="/subscriptions?tab=stats" replace />;
}

export function SubscriptionsAlertsRedirect() {
  return <Navigate to="/subscriptions?tab=alerts" replace />;
}
