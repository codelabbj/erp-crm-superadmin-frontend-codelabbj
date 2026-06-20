import type { PlanDowngradeMember, PlanDowngradeSelection } from "@/lib/adminApi";

export type { PlanDowngradeSelection };

export function parseAssignPlanError(err: unknown): { message: string; downgrade?: PlanDowngradeSelection } {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (data && typeof data === "object") {
    if (data.code === "PLAN_DOWNGRADE_SEAT_SELECTION") {
      return {
        message: String(data.detail ?? "Sélection des membres requise."),
        downgrade: {
          code: "PLAN_DOWNGRADE_SEAT_SELECTION",
          message: String(data.detail ?? ""),
          seats_total: Number(data.seats_total ?? 0),
          active_members: Number(data.active_members ?? 0),
          owner_id: data.owner_id ? String(data.owner_id) : null,
          members: Array.isArray(data.members) ? (data.members as PlanDowngradeMember[]) : [],
          is_downgrade: Boolean(data.is_downgrade),
        },
      };
    }
    if (typeof data.detail === "string") {
      return { message: data.detail };
    }
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Une erreur est survenue." };
}

export function isPlanDowngradeSelectionError(
  parsed: ReturnType<typeof parseAssignPlanError>,
): parsed is { message: string; downgrade: PlanDowngradeSelection } {
  return parsed.downgrade?.code === "PLAN_DOWNGRADE_SEAT_SELECTION";
}
