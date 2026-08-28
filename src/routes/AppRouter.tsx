import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { AcceptInvitePage } from "@/features/auth/AcceptInvitePage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { adminPages } from "@/routes/adminPages";
import { ProtectedRoute, RequirePerm, SuperAdminGuard } from "@/routes/guards";
import { PERM } from "@/lib/platformPermissions";

export function AppRouter() {
  const {
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
    CreditsCatalog,
    BillingOps,
    BusinessInvoicesRedirect,
    DedicatedInstancesRedirect,
    FeatureFlags,
    PdfToolsCatalog,
    Modules,
    Products,
    DataOps,
    Users,
    AuditLogsPage,
    Security,
    Marketing,
    Support,
    Projects,
    Ecommerce,
    Fiscal,
    AIAssistant,
    PaymentTransactionsPage,
    PartnersPage,
    ProductFeedbackPage,
    ProductBacklogPage,
    BlogAdminPage,
    PlatformTeamPage,
    ProfileSecurityPage,
  } = adminPages;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/owner/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password" element={<Navigate to="/owner/forgot-password" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<SuperAdminGuard />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="platform-health" element={<PlatformHealth />} />
              <Route path="business-metrics" element={<BusinessMetrics />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="organizations/:orgId" element={<OrganizationDetailPage />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="payment-transactions" element={<PaymentTransactionsPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="subscriptions/stats" element={<SubscriptionsStatsRedirect />} />
              <Route path="subscriptions/alerts" element={<SubscriptionsAlertsRedirect />} />
              <Route element={<RequirePerm perm={PERM.PLANS_WRITE} />}>
                <Route path="plans" element={<Plans />} />
              </Route>
              <Route path="credits-catalog" element={<CreditsCatalog />} />
              <Route element={<RequirePerm perm={PERM.BILLING_WRITE} />}>
                <Route path="billing/invoices" element={<BillingOps />} />
                <Route path="billing/business-invoices" element={<BusinessInvoicesRedirect />} />
                <Route path="billing/dedicated-instances" element={<DedicatedInstancesRedirect />} />
              </Route>
              <Route path="catalog/products" element={<Products />} />
              <Route path="platform/feature-flags" element={<FeatureFlags />} />
              <Route path="platform/pdf-tools" element={<PdfToolsCatalog />} />
              <Route path="platform/product-feedback" element={<ProductFeedbackPage />} />
              <Route path="platform/backlog" element={<ProductBacklogPage />} />
              <Route path="platform/blog" element={<BlogAdminPage />} />
              <Route path="platform/modules" element={<Modules />} />
              <Route path="platform/jobs" element={<DataOps />} />
              <Route path="platform/staff" element={<Users />} />
              <Route element={<RequirePerm perm={PERM.STAFF_MANAGE} />}>
                <Route path="platform/team" element={<PlatformTeamPage />} />
              </Route>
              <Route path="profile/security" element={<ProfileSecurityPage />} />
              <Route element={<RequirePerm perm={PERM.AUDIT_READ} />}>
                <Route path="security/audit-logs" element={<AuditLogsPage />} />
              </Route>
              <Route path="security/waf" element={<Security />} />
              <Route path="business/marketing" element={<Marketing />} />
              <Route path="business/support" element={<Support />} />
              <Route path="business/projects" element={<Projects />} />
              <Route path="business/ecommerce" element={<Ecommerce />} />
              <Route path="business/fiscal" element={<Fiscal />} />
              <Route path="intelligence/ai" element={<AIAssistant />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
