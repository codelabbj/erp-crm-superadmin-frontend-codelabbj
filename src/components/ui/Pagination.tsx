import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-1 text-xs text-neutral-7 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        {start}–{end} sur {total} résultat{total > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-3.5" />
          Précédent
        </button>
        <span className="font-medium text-neutral-8">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Suivant
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
