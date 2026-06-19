import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OrganizationDetail } from "./OrganizationDetail";

export function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  if (!orgId) return <Navigate to="/organizations" replace />;

  return (
    <OrganizationDetail
      orgId={orgId}
      onBack={() => navigate("/organizations")}
      onOpenSubscriptions={() => navigate("/subscriptions", { state: { focusOrgId: orgId } })}
      onOpenBilling={() => navigate("/billing/invoices")}
      onOpenAudit={() => navigate("/security/audit-logs")}
    />
  );
}
