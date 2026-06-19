import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterBar({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl bg-neutral-1 p-2 ring-1 ring-neutral-4 dark:bg-neutral-8/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-[200px] flex-1", className)}>
      <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-6" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Rechercher…"}
        className="h-9 w-full rounded-lg border border-neutral-4 bg-neutral-0 pr-2 pl-8 text-sm placeholder:text-neutral-6 focus:border-primary-3 focus:ring-2 focus:ring-primary-5 focus:outline-none"
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-lg border border-neutral-4 bg-neutral-0 px-2 pr-7 text-sm",
        "focus:border-primary-3 focus:ring-2 focus:ring-primary-5 focus:outline-none",
        className,
      )}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function FilterButton({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary-5 text-primary-1"
          : "bg-neutral-0 text-neutral-7 ring-1 ring-neutral-4 hover:bg-neutral-1",
      )}
    >
      {children}
    </button>
  );
}
