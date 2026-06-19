import type { PaginatedResponse } from "@/lib/adminApi";

export function paginatedCount<T>(data: PaginatedResponse<T> | T[] | undefined): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  return data.count ?? data.results?.length ?? 0;
}

export function paginatedResults<T>(data: PaginatedResponse<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function clientPageSlice<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total };
}
