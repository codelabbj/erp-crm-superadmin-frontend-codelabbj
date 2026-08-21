import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { adminPages } from "@/routes/adminPages";
import { ProtectedRoute, SuperAdminGuard } from "@/routes/guards";

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
  } = adminPages;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
              <Route path="plans" element={<Plans />} />
              <Route path="credits-catalog" element={<CreditsCatalog />} />
              <Route path="billing/invoices" element={<BillingOps />} />
              <Route path="billing/business-invoices" element={<BusinessInvoicesRedirect />} />
              <Route path="billing/dedicated-instances" element={<DedicatedInstancesRedirect />} />
              <Route path="catalog/products" element={<Products />} />
              <Route path="platform/feature-flags" element={<FeatureFlags />} />
              <Route path="platform/pdf-tools" element={<PdfToolsCatalog />} />
              <Route path="platform/product-feedback" element={<ProductFeedbackPage />} />
              <Route path="platform/backlog" element={<ProductBacklogPage />} />
              <Route path="platform/blog" element={<BlogAdminPage />} />
              <Route path="platform/modules" element={<Modules />} />
              <Route path="platform/jobs" element={<DataOps />} />
              <Route path="platform/staff" element={<Users />} />
              <Route path="security/audit-logs" element={<AuditLogsPage />} />
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
