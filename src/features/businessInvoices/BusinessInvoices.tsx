import { Navigate } from "react-router-dom";

/** Ancienne route — les factures Business se gèrent depuis la fiche organisation. */
export function BusinessInvoicesRedirect() {
  return <Navigate to="/organizations" replace />;
}
