import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OrganizationDetail } from "./OrganizationDetail";
import {
  orgAuditLogsPath,
  orgBusinessInvoicesPath,
  orgSubscriptionsPath,
} from "@/lib/orgNavigation";

export function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  if (!orgId) return <Navigate to="/organizations" replace />;

  return (
    <OrganizationDetail
      orgId={orgId}
      onBack={() => navigate("/organizations")}
      onOpenSubscriptions={() => navigate(orgSubscriptionsPath(orgId))}
      onOpenAssignPlan={() => navigate(orgSubscriptionsPath(orgId, "assign-plan"))}
      onOpenBilling={() => navigate(orgBusinessInvoicesPath(orgId))}
      onOpenAudit={() => navigate(orgAuditLogsPath(orgId))}
    />
  );
}
