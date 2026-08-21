import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  adminApi,
  type AdminNotificationItem,
} from "@/lib/adminApi";
import { orgDetailPath } from "@/lib/orgNavigation";
import { cn } from "@/lib/utils";

const UNREAD_KEY = ["admin-notifications-unread-count"] as const;
const LIST_KEY = ["admin-notifications"] as const;

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function notificationTargetPath(item: AdminNotificationItem): string | null {
  const feedbackId = item.payload?.feedback_id;
  if (typeof feedbackId === "string" && feedbackId) {
    return `/platform/product-feedback?feedback_id=${feedbackId}`;
  }
  const orgId = item.payload?.org_id;
  if (typeof orgId === "string" && orgId) {
    return orgDetailPath(orgId, "billing");
  }
  return null;
}

export function AdminNotificationsBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unread } = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => (await adminApi.notificationsUnreadCount()).count,
    refetchInterval: 30_000,
  });

  const { data: list, isFetching } = useQuery({
    queryKey: LIST_KEY,
    queryFn: async () =>
      (await adminApi.notifications({ limit: 15 })).results,
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (payload: { ids?: string[]; all?: boolean }) =>
      adminApi.markNotificationsRead(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unreadCount = unread ?? 0;

  const onItemClick = (item: AdminNotificationItem) => {
    if (!item.is_read) {
      markRead.mutate({ ids: [item.id] });
    }
    const path = notificationTargetPath(item);
    setOpen(false);
    if (path) navigate(path);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-6 transition-colors hover:bg-neutral-1 hover:text-neutral-9 dark:hover:bg-neutral-8",
          open && "bg-neutral-1 text-neutral-9 dark:bg-neutral-8",
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-1 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div
        className={cn(
          "absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-neutral-4 bg-neutral-0 shadow-lg dark:border-neutral-6",
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-4 px-3 py-2.5 dark:border-neutral-6">
          <p className="text-xs font-semibold tracking-wider text-neutral-9 uppercase opacity-70 dark:text-neutral-10">
            Notifications
          </p>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-[11px] font-medium text-primary-1 hover:underline"
              onClick={() => markRead.mutate({ all: true })}
              disabled={markRead.isPending}
            >
              Tout marquer lu
            </button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {isFetching && !list?.length ? (
            <p className="px-3 py-6 text-center text-xs text-neutral-6">Chargement…</p>
          ) : !list?.length ? (
            <p className="px-3 py-6 text-center text-xs text-neutral-6">
              Aucune notification
            </p>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-neutral-1 dark:hover:bg-neutral-8",
                  !item.is_read && "bg-primary-5/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-neutral-9 dark:text-neutral-10">
                    {item.title}
                  </p>
                  {!item.is_read ? (
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-1" />
                  ) : null}
                </div>
                {item.message ? (
                  <p className="line-clamp-2 text-[11px] text-neutral-6">{item.message}</p>
                ) : null}
                <p className="text-[10px] text-neutral-5">{formatRelative(item.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
