import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export function ProtectedRoute() {
  const hasToken = Boolean(localStorage.getItem("sa_access"));
  if (!hasToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function SuperAdminGuard() {
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-2">
        <p className="text-sm text-neutral-7">Vérification des droits…</p>
      </div>
    );
  }

  if (isError || !me?.user?.is_superuser) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-2 p-4">
        <section className="w-[min(92vw,520px)] rounded-2xl border border-neutral-4 bg-neutral-0 p-5 shadow-sm">
          <h2 className="m-0 text-lg font-semibold text-neutral-9">Accès refusé</h2>
          <p className="mt-2 mb-4 text-sm text-neutral-7">
            Cette interface est réservée aux utilisateurs super admin.
          </p>
          <button
            type="button"
            className="btn-magenta"
            onClick={() => {
              localStorage.removeItem("sa_access");
              localStorage.removeItem("sa_refresh");
              window.location.href = "/login";
            }}
          >
            Se déconnecter
          </button>
        </section>
      </div>
    );
  }

  return <Outlet />;
}
