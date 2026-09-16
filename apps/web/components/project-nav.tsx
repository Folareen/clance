"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  MessageCircle,
  FileText,
  Folder,
  Video,
  Activity,
  Sparkles,
  Settings,
  ChevronLeft,
  MoreHorizontal,
  X,
  Search,
  Bell,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ProjectAvatar } from "./project-avatar";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import { fullName, initials } from "@/lib/display";
import type { Role } from "@/lib/api";

type NavProject = { id: string; name: string; role?: Role };

type NavItem = {
  name: string;
  short?: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

function buildNav(projectId: string) {
  const base = `/app/projects/${projectId}`;
  const primary: NavItem[] = [
    { name: "Overview", short: "Home", href: base, icon: LayoutDashboard, exact: true },
    { name: "Tasks", href: `${base}/tasks`, icon: CheckSquare },
    { name: "Chat", href: `${base}/chat`, icon: MessageCircle },
    { name: "Files", href: `${base}/files`, icon: Folder },
  ];
  const secondary: NavItem[] = [
    { name: "Notes", href: `${base}/notes`, icon: FileText },
    { name: "Meetings", href: `${base}/meetings`, icon: Video },
    { name: "Activity", href: `${base}/activity`, icon: Activity },
    { name: "AI Assistant", href: `${base}/assistant`, icon: Sparkles },
    { name: "Settings", href: `${base}/settings`, icon: Settings },
  ];
  return { primary, secondary };
}

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

/* ------------------------------------------------------------------ *
 * Desktop sidebar, always dark, like the marketing nav surface
 * ------------------------------------------------------------------ */

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 h-9 rounded-lg text-sm font-medium",
        "transition-colors duration-150",
        active
          ? "bg-nav-active text-nav-content-active"
          : "text-nav-content hover:bg-nav-hover hover:text-nav-content-active"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-accent" />
      )}
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

function DesktopSidebar({ project }: { project: NavProject }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { primary, secondary } = buildNav(project.id);
  const userName = fullName(user);

  return (
    <aside className="hidden lg:flex flex-col w-60 min-w-60 h-screen bg-nav-bg">
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Clance</span>
        <div className="ml-auto flex items-center gap-0.5">
          <Link
            href="/app/search"
            aria-label="Search"
            className="flex items-center justify-center w-7 h-7 rounded-md text-nav-content hover:bg-nav-hover hover:text-nav-content-active transition-colors"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            href="/app/notifications"
            aria-label="Notifications"
            className="flex items-center justify-center w-7 h-7 rounded-md text-nav-content hover:bg-nav-hover hover:text-nav-content-active transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Link
        href="/app"
        className="flex items-center gap-1.5 mx-3 mb-2 px-2 h-7 rounded-md text-xs text-nav-content hover:bg-nav-hover hover:text-nav-content-active transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All projects
      </Link>

      <div className="mx-3 mb-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <ProjectAvatar project={project} size={30} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {project.name}
            </p>
            <span className="text-[11px] text-nav-content capitalize">
              {project.role ?? "member"}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scroll-thin">
        {primary.map((item) => (
          <SidebarLink key={item.name} item={item} active={isActive(pathname, item)} />
        ))}

        <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-nav-content/60">
          Project
        </p>

        {secondary.map((item) => (
          <SidebarLink key={item.name} item={item} active={isActive(pathname, item)} />
        ))}
      </nav>

      <div className="p-3 mt-2 border-t border-white/[0.06] space-y-0.5">
        <ThemeToggle variant="nav" />
        <div className="flex items-center gap-1">
          <Link
            href="/app/settings"
            className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-2 rounded-lg hover:bg-nav-hover transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {initials(userName) || "?"}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {userName || "Account"}
            </span>
          </Link>
          <button
            onClick={logout}
            aria-label="Log out"
            className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-nav-content hover:bg-nav-hover hover:text-nav-content-active transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile top bar, project identity + search/notifications
 * ------------------------------------------------------------------ */

function MobileTopBar({ project }: { project: NavProject }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-nav-bg">
      <Link href="/app" aria-label="All projects" className="shrink-0 -ml-1 p-1 text-nav-content">
        <ChevronLeft className="w-5 h-5" />
      </Link>
      <ProjectAvatar project={project} size={26} />
      <span className="text-sm font-semibold text-white truncate flex-1">
        {project.name}
      </span>
      <Link
        href="/app/search"
        aria-label="Search"
        className="flex items-center justify-center w-9 h-9 rounded-lg text-nav-content active:bg-nav-hover transition-colors"
      >
        <Search className="w-[18px] h-[18px]" />
      </Link>
      <Link
        href="/app/notifications"
        aria-label="Notifications"
        className="flex items-center justify-center w-9 h-9 -mr-1.5 rounded-lg text-nav-content active:bg-nav-hover transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
      </Link>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile: 4 tabs + More sheet
 * ------------------------------------------------------------------ */

function MoreSheet({
  project,
  items,
  pathname,
  onClose,
}: {
  project: NavProject;
  items: NavItem[];
  pathname: string;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const userName = fullName(user);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-2xl shadow-xl animate-sheet-in pb-safe">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-stroke">
          <ProjectAvatar project={project} size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content truncate leading-tight">
              {project.name}
            </p>
            <span className="text-[11px] text-content-muted capitalize">
              {project.role ?? "member"}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 -mr-1.5 rounded-lg text-content-secondary active:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-2 max-h-[55vh] overflow-y-auto scroll-thin">
          {items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3.5 px-3 h-12 rounded-xl text-[15px] font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-content active:bg-surface-hover"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stroke p-2 space-y-0.5">
          <ThemeToggle variant="sheet" />
          <Link
            href="/app/settings"
            onClick={onClose}
            className="flex items-center gap-3.5 px-3 h-12 rounded-xl active:bg-surface-hover transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {initials(userName) || "?"}
            </span>
            <span className="text-[15px] font-medium text-content truncate flex-1">
              {userName || "Account"}
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3.5 w-full px-3 h-12 rounded-xl text-[15px] font-medium text-danger active:bg-surface-hover transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileTabBar({ project }: { project: NavProject }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { primary, secondary } = buildNav(project.id);

  const secondaryActive = secondary.some((item) => isActive(pathname, item));

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch h-bottom-nav bg-surface/95 backdrop-blur-lg border-t border-stroke pb-safe">
        {primary.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors",
                active ? "text-accent" : "text-content-muted active:text-content"
              )}
            >
              <item.icon className={cn("w-[22px] h-[22px]", active && "stroke-[2.4]")} />
              <span className="text-[10px] font-semibold">{item.short ?? item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="More"
          aria-expanded={sheetOpen}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors",
            secondaryActive ? "text-accent" : "text-content-muted active:text-content"
          )}
        >
          <MoreHorizontal className="w-[22px] h-[22px]" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {sheetOpen && (
        <MoreSheet
          project={project}
          items={secondary}
          pathname={pathname}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}

export function ProjectNav({ project }: { project: NavProject }) {
  return (
    <>
      <DesktopSidebar project={project} />
      <MobileTabBar project={project} />
    </>
  );
}

export { MobileTopBar };
