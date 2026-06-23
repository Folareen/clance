"use client";

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
  ChevronLeft,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ProjectAvatar } from "./project-avatar";
import { cn } from "@/lib/utils";
import { currentUser, type Project } from "@/lib/data";

function buildNav(projectId: string) {
  const base = `/projects/${projectId}`;
  return {
    primary: [
      { name: "Overview", href: base, icon: LayoutDashboard, exact: true },
      { name: "Tasks", href: `${base}/tasks`, icon: CheckSquare },
      { name: "Chat", href: `${base}/chat`, icon: MessageCircle },
      { name: "Notes", href: `${base}/notes`, icon: FileText },
      { name: "Files", href: `${base}/files`, icon: Folder },
    ],
    secondary: [
      { name: "Meetings", href: `${base}/meetings`, icon: Video },
      { name: "Activity", href: `${base}/activity`, icon: Activity },
      { name: "AI Assistant", href: `${base}/assistant`, icon: Sparkles },
    ],
  };
}

function useNavItems(project: Project) {
  const pathname = usePathname();
  const nav = buildNav(project.id);
  const withActive = <T extends { href: string; exact?: boolean }>(item: T) => ({
    ...item,
    active: item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/"),
  });
  return {
    primary: nav.primary.map(withActive),
    secondary: nav.secondary.map(withActive),
  };
}

export function ProjectNav({ project }: { project: Project }) {
  const { primary, secondary } = useNavItems(project);

  return (
    <>
      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-w-60 h-screen bg-surface border-r border-stroke">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 h-14 shrink-0 text-content-secondary hover:text-content text-sm transition-colors border-b border-stroke-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          All projects
        </Link>

        <div className="px-4 py-4 border-b border-stroke-secondary">
          <div className="flex items-center gap-2.5">
            <ProjectAvatar project={project} size={32} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content truncate">
                {project.name}
              </p>
              <span className="text-[11px] text-content-muted">
                {project.role === "manager" ? "Manager" : "Worker"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {primary.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent-soft text-accent"
                  : "text-content-secondary hover:bg-surface-hover hover:text-content"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          ))}

          <div className="my-2 mx-3 border-t border-stroke-secondary" />

          {secondary.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent-soft text-accent"
                  : "text-content-secondary hover:bg-surface-hover hover:text-content"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-stroke-secondary space-y-1">
          <ThemeToggle variant="project" />
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content truncate">
                {currentUser.name}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: bottom bar (primary pages only) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch h-16 bg-surface/90 backdrop-blur-md border-t border-stroke">
        {primary.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              item.active
                ? "text-accent"
                : "text-content-muted hover:text-content"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
