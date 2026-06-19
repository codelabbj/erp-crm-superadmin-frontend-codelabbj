import { LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

type TopbarProps = {
  onMenuClick: () => void;
  onLogout: () => void;
};

export function Topbar({ onMenuClick, onLogout }: TopbarProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-4 border-b border-neutral-4 bg-neutral-0 px-5 dark:border-neutral-6 dark:bg-neutral-0">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-7 transition-colors hover:bg-neutral-1 hover:text-neutral-9 md:hidden dark:hover:bg-neutral-8"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-6 transition-colors hover:bg-neutral-1 hover:text-neutral-9 dark:hover:bg-neutral-8"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-2 h-5 w-px bg-neutral-4 dark:bg-neutral-6" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((open) => !open)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-all duration-200",
              isDropdownOpen
                ? "bg-neutral-1 ring-1 ring-neutral-4 dark:bg-neutral-8 dark:ring-neutral-6"
                : "hover:bg-neutral-1 dark:hover:bg-neutral-8",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-1/20 bg-primary-5">
              <UserIcon className="h-4 w-4 text-primary-1" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs leading-none font-semibold text-neutral-9 dark:text-neutral-10">Super Admin</p>
              <p className="mt-0.5 text-[10px] leading-none text-neutral-6">OwoDesk</p>
            </div>
          </button>

          <div
            className={cn(
              "absolute top-full right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-neutral-4 bg-neutral-0 p-1.5 shadow-lg dark:border-neutral-6",
              "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isDropdownOpen
                ? "visible translate-y-0 scale-100 opacity-100"
                : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0",
            )}
          >
            <div className="mb-1 border-b border-neutral-4 px-3 py-3 dark:border-neutral-6">
              <p className="text-xs font-semibold tracking-wider text-neutral-9 uppercase opacity-60 dark:text-neutral-10">
                Administrateur
              </p>
              <p className="mt-1.5 truncate text-[11px] font-medium text-neutral-7 dark:text-neutral-3">
                {me?.user?.email || "Chargement…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-danger-1 transition-all hover:bg-danger-2 active:scale-[0.98]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
