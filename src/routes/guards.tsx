import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { hasPerm, resolvePlatformPerms } from "@/lib/platformPermissions";

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

  const canAccess =
    Boolean(me?.user?.can_access_console) || Boolean(me?.user?.is_superuser);

  if (isError || !canAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-2 p-4">
        <section className="w-[min(92vw,520px)] rounded-2xl border border-neutral-4 bg-neutral-0 p-5 shadow-sm">
          <h2 className="m-0 text-lg font-semibold text-neutral-9">Accès refusé</h2>
          <p className="mt-2 mb-4 text-sm text-neutral-7">
            Cette interface est réservée aux utilisateurs de la console Super Admin.
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

/** Bloque une route si la permission plateforme manque (menus seuls ne suffisent pas). */
export function RequirePerm({ perm }: { perm: string }) {
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center p-10">
        <p className="text-sm text-neutral-7">Vérification des droits…</p>
      </div>
    );
  }

  if (!hasPerm(resolvePlatformPerms(me?.user), perm)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
