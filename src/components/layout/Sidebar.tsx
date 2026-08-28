import { ChevronLeft, ChevronRight, LogOut, RefreshCw } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { NAV_SECTIONS, type NavSection } from "@/lib/navigation";
import { hasPerm, PATH_PERMISSION, resolvePlatformPerms } from "@/lib/platformPermissions";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  userEmail?: string;
  userName?: string;
  meUser?: {
    platform_permissions?: string[] | null;
    platform_role?: string | null;
    is_superuser?: boolean;
  };
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
};

function filterSections(
  sections: NavSection[],
  meUser?: SidebarProps["meUser"],
): NavSection[] {
  const permissions = resolvePlatformPerms(meUser);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const required = PATH_PERMISSION[item.path];
        if (!required) return true;
        return hasPerm(permissions, required);
      }),
    }))
    .filter((s) => s.items.length > 0);
}

function NavSections({ sections, isCollapsed }: { sections: NavSection[]; isCollapsed: boolean }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.sectionKey} className="space-y-0.5">
          {!isCollapsed ? (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-6">
              {section.title}
            </p>
          ) : (
            <div className="mx-3 mb-1 h-px bg-neutral-4/60" aria-hidden />
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end ?? item.path === "/"}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex h-9 items-center gap-3 overflow-hidden rounded-xl px-3",
                  "text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary-5 text-primary-1 shadow-[inset_3px_0_0_0_var(--owo-accent)]"
                    : "text-neutral-7 hover:bg-neutral-1 hover:text-neutral-9 dark:hover:bg-neutral-8 dark:hover:text-neutral-10",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-1" : "text-neutral-6")}
                  />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap",
                      "transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

export function Sidebar({
  isCollapsed,
  onToggle,
  userEmail,
  userName,
  meUser,
  onLogout,
  onRefresh,
  isRefreshing,
}: SidebarProps) {
  const sections = filterSections(NAV_SECTIONS, meUser);
  return (
    <aside
      className={cn(
        "relative z-50 flex h-screen shrink-0 flex-col",
        "border-r border-neutral-4 bg-neutral-3 dark:bg-neutral-0",
        "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 shrink-0 items-center overflow-hidden border-b border-neutral-4 px-4">
        <Logo isCollapsed={isCollapsed} />
      </div>

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3">
        <NavSections sections={sections} isCollapsed={isCollapsed} />
      </nav>

      <div className="shrink-0 space-y-2 border-t border-neutral-4 p-3">
        {!isCollapsed ? (
          <div className="px-2 py-1.5">
            <p className="truncate text-xs font-medium text-neutral-9 dark:text-neutral-10">
              {userName || "Super admin"}
            </p>
            <p className="truncate text-[10px] text-neutral-6">{userEmail || "—"}</p>
          </div>
        ) : null}

        <button
          type="button"
          title={isCollapsed ? "Rafraîchir" : undefined}
          disabled={isRefreshing}
          onClick={onRefresh}
          className={cn(
            "flex h-9 w-full items-center gap-3 overflow-hidden rounded-xl px-3",
            "text-sm font-medium text-neutral-7 transition-colors duration-150",
            "hover:bg-neutral-1 hover:text-neutral-9 disabled:opacity-50",
          )}
        >
          <RefreshCw className={cn("h-4 w-4 shrink-0 text-neutral-6", isRefreshing && "animate-spin")} />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-300",
              isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
            )}
          >
            {isRefreshing ? "Rafraîchissement…" : "Rafraîchir"}
          </span>
        </button>

        <button
          type="button"
          title={isCollapsed ? "Déconnexion" : undefined}
          onClick={onLogout}
          className={cn(
            "flex h-9 w-full items-center gap-3 overflow-hidden rounded-xl px-3",
            "text-sm font-medium text-neutral-7 transition-colors duration-150",
            "hover:bg-danger-2 hover:text-danger-1",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-neutral-6" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-300",
              isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
            )}
          >
            Déconnexion
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        onClick={onToggle}
        className={cn(
          "absolute top-[4.5rem] -right-3.5 z-[100] flex h-7 w-7 cursor-pointer items-center justify-center rounded-full",
          "border border-neutral-4 bg-neutral-0 shadow-sm",
          "text-neutral-6 transition-all duration-200 hover:border-primary-1 hover:text-primary-1",
        )}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
