import { Navigate } from "react-router-dom";

/** Ancienne route — les instances dédiées se gèrent depuis la fiche organisation. */
export function DedicatedInstancesRedirect() {
  return <Navigate to="/organizations" replace />;
}
