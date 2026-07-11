"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  MessageCircle,
  FileText,
  Folder,
  Settings,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ProjectAvatar } from "@/components/project-avatar";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { api, type ProjectDashboard, type TaskStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  backlog: { label: "Backlog", icon: Circle, className: "text-content-muted" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-info" },
  submitted: { label: "Submitted", icon: AlertCircle, className: "text-warning" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-success" },
};

function formatDue(iso: string) {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProjectOverview() {
  const { project } = useProject();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);

  useEffect(() => {
    if (!project) return;
    api.getProjectDashboard(project.id).then(setDashboard).catch(() => {});
  }, [project?.id]);

  if (!project) return null;

  const me = project.members.find((m) => m.user_id === user?.id);

  const quickLinks = [
    { name: "Tasks", href: `/app/projects/${project.id}/tasks`, icon: CheckSquare },
    { name: "Chat", href: `/app/projects/${project.id}/chat`, icon: MessageCircle },
    { name: "Notes", href: `/app/projects/${project.id}/notes`, icon: FileText },
    { name: "Files", href: `/app/projects/${project.id}/files`, icon: Folder },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <ProjectAvatar project={project} size={48} className="rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-content">
              {project.name}
            </h1>
            {me && (
              <span className="text-xs text-content-muted capitalize">
                {me.role}
              </span>
            )}
          </div>
          <p className="text-content-secondary mt-1">
            {project.description || "No description yet."}
          </p>
        </div>
        <Link
          href={`/app/projects/${project.id}/settings`}
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content transition-colors shrink-0"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>

      {/* Task stats */}
      {dashboard && dashboard.total_tasks > 0 && (
        <div className="bg-surface border border-stroke rounded-xl mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-stroke-secondary">
            {([
              ["backlog", dashboard.tasks_by_status.backlog],
              ["in_progress", dashboard.tasks_by_status.in_progress],
              ["submitted", dashboard.tasks_by_status.submitted],
            ] as [TaskStatus, number][]).map(([key, count]) => {
              const cfg = statusConfig[key];
              const Icon = cfg.icon;
              return (
                <div key={key} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-3.5 h-3.5", cfg.className)} />
                    <span className="text-xs font-medium text-content-muted uppercase tracking-wider">
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-content">{count}</p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-stroke-secondary grid grid-cols-3 divide-x divide-stroke-secondary">
            <div className="px-5 py-3">
              <span className="text-xs text-content-muted">Approved</span>
              <p className="text-sm font-semibold text-success">{dashboard.tasks_by_status.approved}</p>
            </div>
            <div className="px-5 py-3">
              <span className="text-xs text-content-muted">Overdue</span>
              <p className={cn("text-sm font-semibold", dashboard.overdue_tasks > 0 ? "text-danger" : "text-content")}>
                {dashboard.overdue_tasks}
              </p>
            </div>
            <div className="px-5 py-3">
              <span className="text-xs text-content-muted">My tasks</span>
              <p className="text-sm font-semibold text-content">{dashboard.my_tasks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recently updated */}
      {dashboard && dashboard.recent_tasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
            Recently updated
          </h2>
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {dashboard.recent_tasks.map((task) => {
              const cfg = statusConfig[task.status];
              const Icon = cfg.icon;
              const overdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== "approved";

              return (
                <Link
                  key={task.id}
                  href={`/app/projects/${project.id}/tasks`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover/50 transition-colors group"
                >
                  <Icon className={cn("w-4 h-4 shrink-0", cfg.className)} />
                  <span className="text-xs text-content-muted font-mono shrink-0">
                    #{task.task_number}
                  </span>
                  <span className="text-sm font-medium text-content truncate flex-1 group-hover:text-accent transition-colors">
                    {task.title}
                  </span>
                  {task.due_date && (
                    <span className={cn("text-xs shrink-0", overdue ? "text-danger font-medium" : "text-content-secondary")}>
                      {formatDue(task.due_date)}
                    </span>
                  )}
                  <span className={cn("text-xs font-medium shrink-0 hidden sm:inline", cfg.className)}>
                    {cfg.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Jump to */}
      <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
        Jump to
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group flex flex-col gap-3 bg-surface border border-stroke rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-hover group-hover:bg-accent-soft flex items-center justify-center transition-colors">
              <link.icon className="w-5 h-5 text-content-secondary group-hover:text-accent transition-colors" />
            </div>
            <span className="font-medium text-content group-hover:text-accent transition-colors">
              {link.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
