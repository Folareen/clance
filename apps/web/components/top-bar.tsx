"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-provider";
import { fullName, initials } from "@/lib/display";
import { api } from "@/lib/api";

export function TopBar() {
  const { user } = useAuth();
  const userInitials = initials(fullName(user)) || "?";
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.unreadCount().then((r) => setUnread(r.count)).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 h-14 px-4 sm:px-6 bg-surface/80 backdrop-blur-md border-b border-stroke">
      <Link href="/app" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-content font-semibold text-lg tracking-tight hidden sm:block">
          Clance
        </span>
      </Link>

      <div className="flex-1 max-w-md mx-auto">
        <Link
          href="/app/search"
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-stroke bg-surface-secondary text-content-muted text-sm hover:border-accent/30 transition-colors"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Search projects, tasks, people…</span>
          <kbd className="ml-auto text-[11px] bg-surface-active px-1.5 py-0.5 rounded font-mono hidden sm:block">
            ⌘K
          </kbd>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle variant="inline" />
        <Link
          href="/app/notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-stroke bg-surface hover:bg-surface-hover text-content-secondary transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
        <Link
          href="/app/settings"
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {userInitials}
        </Link>
      </div>
    </header>
  );
}
