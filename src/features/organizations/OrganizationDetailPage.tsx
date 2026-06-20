import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OrganizationDetail } from "./OrganizationDetail";
import { orgAuditLogsPath } from "@/lib/orgNavigation";

export function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  if (!orgId) return <Navigate to="/organizations" replace />;

  return (
    <OrganizationDetail
      orgId={orgId}
      onBack={() => navigate("/organizations")}
      onOpenAudit={() => navigate(orgAuditLogsPath(orgId))}
    />
  );
}
