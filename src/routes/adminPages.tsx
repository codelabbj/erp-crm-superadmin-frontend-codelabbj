import { useLocation, useNavigate } from "react-router-dom";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { PlatformHealth } from "@/features/dashboard/PlatformHealth";
import { BusinessMetrics } from "@/features/dashboard/BusinessMetrics";
import { Organizations } from "@/features/organizations/Organizations";
import { OrganizationDetailPage } from "@/features/organizations/OrganizationDetailPage";
import { Onboarding } from "@/features/organizations/Onboarding";
import { SubscriptionsHub, SubscriptionsStatsRedirect, SubscriptionsAlertsRedirect } from "@/features/subscriptions/SubscriptionsHub";
import { Plans } from "@/features/plans/Plans";
import { BillingOps } from "@/features/billingOps/BillingOps";
import { BusinessInvoicesRedirect } from "@/features/businessInvoices/BusinessInvoices";
import { DedicatedInstancesRedirect } from "@/features/dedicatedInstances/DedicatedInstances";
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
import { ORG_QUERY_KEY, readOrgIdFromSearch } from "@/lib/orgNavigation";

export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onOpenOrgSubscriptions={(orgId) =>
        navigate(`/subscriptions?${ORG_QUERY_KEY}=${orgId}`)
      }
      onOpenOrganizationsList={() => navigate("/organizations")}
    />
  );
}

export function SubscriptionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orgFromUrl = readOrgIdFromSearch(location.search);
  const focusOrgId =
    orgFromUrl ||
    (location.state as { focusOrgId?: string } | null)?.focusOrgId ||
    null;

  return (
    <SubscriptionsHub
      focusOrgId={focusOrgId}
      onFocusOrgHandled={() => {
        if (!orgFromUrl) navigate(".", { replace: true, state: {} });
      }}
    />
  );
}

export function AuditLogsPage() {
  const location = useLocation();
  const orgId = readOrgIdFromSearch(location.search);
  return <AuditLogs orgId={orgId} />;
}

export const adminPages = {
  DashboardPage,
  PlatformHealth,
  BusinessMetrics,
  Organizations,
  OrganizationDetailPage,
  Onboarding,
  SubscriptionsPage,
  SubscriptionsStatsRedirect,
  SubscriptionsAlertsRedirect,
  Plans,
  BillingOps,
  BusinessInvoicesRedirect,
  DedicatedInstancesRedirect,
  FeatureFlags,
  Modules,
  DataOps,
  Users,
  AuditLogs,
  AuditLogsPage,
  Security,
  Marketing,
  Support,
  Projects,
  Ecommerce,
  Fiscal,
  AIAssistant,
};
