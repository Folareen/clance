"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Loader2,
  CheckSquare,
  ArrowRightLeft,
  MessageCircle,
  UserPlus,
  UserCheck,
  Mail,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RequireAuth } from "@/components/require-auth";
import { api, type Notification, type NotificationType } from "@/lib/api";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; className: string }
> = {
  task_assigned: { icon: CheckSquare, className: "text-info" },
  task_status_changed: { icon: ArrowRightLeft, className: "text-warning" },
  task_commented: { icon: MessageCircle, className: "text-content-muted" },
  project_invited: { icon: Mail, className: "text-accent" },
  member_joined: { icon: UserCheck, className: "text-success" },
  dm_received: { icon: MessageCircle, className: "text-info" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    api.listNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
    setMarkingAll(false);
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    api.markRead(id).catch(() => {});
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-content">
              Notifications
            </h1>
            <p className="text-content-secondary mt-1">
              {unread > 0
                ? `${unread} unread notification${unread !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-60"
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-content-muted" />
            </div>
            <p className="text-sm text-content-muted">
              New notifications about your tasks, mentions, and approvals will
              show up here.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {notifications.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              const actorName = n.actor
                ? n.actor.first_name
                  ? `${n.actor.first_name} ${n.actor.last_name ?? ""}`.trim()
                  : n.actor.email
                : null;

              const inner = (
                <div
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 transition-colors",
                    !n.read && "bg-accent-soft/30",
                    n.link && "hover:bg-surface-hover/50 cursor-pointer",
                  )}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      !n.read ? "bg-accent-soft text-accent" : "bg-surface-hover text-content-muted",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-snug", !n.read ? "font-medium text-content" : "text-content-secondary")}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-content-muted mt-0.5 truncate">
                        {n.body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-content-muted">
                        {timeAgo(n.created_at)}
                      </span>
                      {n.project_name && (
                        <span className="text-[11px] text-content-muted">
                          · {n.project_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                  )}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => !n.read && handleMarkRead(n.id)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}
