import { BusinessInvoicesOrgPage } from "./BusinessInvoicesOrgPage";

/** Route facturation Business — requiert ?org=uuid (depuis fiche organisation). */
export function BusinessInvoicesRedirect() {
  return <BusinessInvoicesOrgPage />;
}
