import { useLocation, useNavigate } from "react-router-dom";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { PlatformHealth } from "@/features/dashboard/PlatformHealth";
import { BusinessMetrics } from "@/features/dashboard/BusinessMetrics";
import { Organizations } from "@/features/organizations/Organizations";
import { Onboarding } from "@/features/organizations/Onboarding";
import { Subscriptions } from "@/features/subscriptions/Subscriptions";
import { SubscriptionsStats } from "@/features/subscriptions/SubscriptionsStats";
import { SubscriptionsAlerts } from "@/features/subscriptions/SubscriptionsAlerts";
import { Plans } from "@/features/plans/Plans";
import { BillingOps } from "@/features/billingOps/BillingOps";
import { FeatureFlags } from "@/features/featureFlags/FeatureFlags";
import { Modules } from "@/features/modules/Modules";
import { DataOps } from "@/features/dataOps/DataOps";
import { Users } from "@/features/users/Users";
import { AuditLogs } from "@/features/auditLogs/AuditLogs";
import { Security } from "@/features/security/Security";
import { Marketing } from "@/features/marketing/Marketing";
import { Support } from "@/features/support/Support";
import { Projects } from "@/features/projects/Projects";
import { Ecommerce } from "@/features/ecommerce/Ecommerce";
import { Fiscal } from "@/features/fiscal/Fiscal";
import { AIAssistant } from "@/features/ai/AIAssistant";

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onOpenOrgSubscriptions={(orgId) => navigate("/subscriptions", { state: { focusOrgId: orgId } })}
      onOpenOrganizationsList={() => navigate("/organizations")}
    />
  );
}

export function SubscriptionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const focusOrgId = (location.state as { focusOrgId?: string } | null)?.focusOrgId ?? null;

  return (
    <Subscriptions
      focusOrgId={focusOrgId}
      onFocusOrgHandled={() => navigate(".", { replace: true, state: {} })}
    />
  );
}

export const adminPages = {
  DashboardPage,
  PlatformHealth,
  BusinessMetrics,
  Organizations,
  Onboarding,
  SubscriptionsPage,
  SubscriptionsStats,
  SubscriptionsAlerts,
  Plans,
  BillingOps,
  FeatureFlags,
  Modules,
  DataOps,
  Users,
  AuditLogs,
  Security,
  Marketing,
  Support,
  Projects,
  Ecommerce,
  Fiscal,
  AIAssistant,
};
