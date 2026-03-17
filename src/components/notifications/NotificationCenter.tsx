"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { Bell } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatWhen(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationCenter({
  audience,
  username,
}: {
  audience: "ADMIN" | "USER";
  username?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const query = useMemo(() => {
    const base = `/api/notifications?audience=${audience}`;
    if (audience === "USER" && username) {
      return `${base}&username=${encodeURIComponent(username)}`;
    }

    return base;
  }, [audience, username]);

  useEffect(() => {
    if (audience === "USER" && !username) {
      return;
    }

    let stopped = false;

    const load = async () => {
      try {
        const response = await fetch(query, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          unreadCount: number;
          notifications: NotificationItem[];
        };

        if (stopped) {
          return;
        }

        setUnreadCount(payload.unreadCount || 0);
        setItems(payload.notifications || []);
      } catch {
        // Ignore temporary fetch errors for polling UI.
      }
    };

    load();
    const interval = window.setInterval(load, 10000);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [audience, query, username]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent | PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("pointerdown", handleClickOutside, true);
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("touchstart", handleClickOutside, true);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("pointerdown", handleClickOutside, true);
        document.removeEventListener("mousedown", handleClickOutside, true);
        document.removeEventListener("touchstart", handleClickOutside, true);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open]);

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, username, all: true }),
      });
      setUnreadCount(0);
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      // Ignore mark read errors in UI.
    }
  }

  if (audience === "USER" && !username) {
    return null;
  }

  const dropdownClass =
    audience === "ADMIN"
      ? "fixed right-4 top-16 w-[340px] max-w-[92vw]"
      : "absolute right-0 top-11 w-[340px] max-w-[85vw]";

  return (
    <div className="relative z-80" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
        aria-label="Toggle notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`${dropdownClass} rounded-xl border border-border bg-card p-3 shadow-xl`}
          style={{ zIndex: 2000 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    item.isRead
                      ? "border-border bg-background/50"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {formatWhen(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.message}
                  </p>
                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
