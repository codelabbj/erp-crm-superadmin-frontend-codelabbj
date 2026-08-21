import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  isCollapsed?: boolean;
};

export function Logo({ className, isCollapsed }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none overflow-hidden", className)}>
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          "bg-primary-5 text-primary-1 font-bold text-sm",
          "border border-primary-1/15",
        )}
        aria-hidden
      >
        O
      </div>
      <div
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100",
        )}
      >
        <p className="m-0 text-sm font-bold leading-tight text-neutral-9 dark:text-neutral-10">
          Owo<span className="text-primary-1">Desk</span>
        </p>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-6">Super Admin</span>
      </div>
    </div>
  );
}
