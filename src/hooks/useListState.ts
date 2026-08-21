import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePaginationState(pageSize = 30) {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * pageSize;
  const resetPage = () => setPage(1);
  return { page, setPage, offset, pageSize, resetPage };
}
