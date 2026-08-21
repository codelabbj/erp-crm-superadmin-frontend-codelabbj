import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2.5 text-xl leading-tight font-bold tracking-tight text-neutral-9 dark:text-neutral-10">
          <span
            className="h-6 w-1 shrink-0 rounded-full bg-primary-1 shadow-[0_0_10px_#d9451055]"
            aria-hidden
          />
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-xs text-neutral-6">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ListPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-neutral-4 bg-neutral-0 p-5 shadow-sm dark:border-neutral-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
