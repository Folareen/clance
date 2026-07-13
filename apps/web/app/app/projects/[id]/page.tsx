"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Users as UsersIcon,
  Loader2,
  CheckSquare,
  Plus,
} from "lucide-react";
import { ProjectAvatar } from "@/components/project-avatar";
import { PagePlaceholder } from "@/components/page-placeholder";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import {
  api,
  type ProjectDashboard,
  type TaskStatus,
  type DashboardTaskSummary,
} from "@/lib/api";
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

const UNKNOWN_STATUS = { label: "Unknown", icon: Circle, className: "text-content-muted" };

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

  const loadDashboard = useCallback(() => {
    if (!project) return;
    api.getProjectDashboard(project.id).then(setDashboard).catch(() => {});
  }, [project?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!project) return null;

  const me = project.members.find((m) => m.user_id === user?.id);

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <ProjectAvatar project={project} size={40} className="rounded-lg shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-content truncate">
              {project.name}
            </h1>
            {me && (
              <span className="text-xs text-content-muted capitalize shrink-0">
                {me.role}
              </span>
            )}
          </div>
          <p className="text-content-secondary mt-1">
            {project.description || "No description yet."}
          </p>
        </div>
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

      {/* Role-specific widgets */}
      {dashboard && dashboard.role === "manager" && (
        <ManagerWidgets dashboard={dashboard} projectId={project.id} />
      )}
      {dashboard && dashboard.role === "worker" && (
        <WorkerWidgets
          dashboard={dashboard}
          projectId={project.id}
          onChanged={loadDashboard}
        />
      )}

      {/* Recently updated */}
      {dashboard && dashboard.recent_tasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
            Recently updated
          </h2>
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {dashboard.recent_tasks.map((task) => {
              const cfg = statusConfig[task.status] ?? UNKNOWN_STATUS;
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

      {dashboard && dashboard.total_tasks === 0 && (
        <PagePlaceholder
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to start tracking work on this project."
          action={
            <Link
              href={`/app/projects/${project.id}/tasks`}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Go to Tasks
            </Link>
          }
        />
      )}
    </div>
  );
}

const priorityDot: Record<string, string> = {
  urgent: "bg-danger",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-content-muted",
  none: "bg-transparent",
};

function TaskRefRow({
  task,
  projectId,
  trailing,
}: {
  task: DashboardTaskSummary;
  projectId: string;
  trailing?: React.ReactNode;
}) {
  const overdue =
    task.due_date && new Date(task.due_date) < new Date();

  return (
    <Link
      href={`/app/projects/${projectId}/tasks`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover/50 transition-colors group"
    >
      {task.priority && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDot[task.priority])}
          title={task.priority}
        />
      )}
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
      {trailing}
    </Link>
  );
}

function WorkerWidgets({
  dashboard,
  projectId,
  onChanged,
}: {
  dashboard: ProjectDashboard;
  projectId: string;
  onChanged: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const pending = dashboard.my_pending_tasks ?? [];
  const awaitingAction = dashboard.awaiting_my_action ?? [];

  const handleQuickSubmit = async (taskId: string) => {
    setSubmitting(taskId);
    try {
      await api.updateTask(projectId, taskId, { status: "submitted" });
      onChanged();
    } catch {
    } finally {
      setSubmitting(null);
    }
  };

  if (pending.length === 0) return null;

  return (
    <div className="mb-6 space-y-6">
      {awaitingAction.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
            Awaiting your action
          </h2>
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {awaitingAction.map((task) => (
              <TaskRefRow
                key={task.id}
                task={task}
                projectId={projectId}
                trailing={
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleQuickSubmit(task.id);
                    }}
                    disabled={submitting === task.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors shrink-0 disabled:opacity-60"
                  >
                    {submitting === task.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Submit
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
          My pending tasks
        </h2>
        <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
          {pending.map((task) => (
            <TaskRefRow key={task.id} task={task} projectId={projectId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ManagerWidgets({
  dashboard,
  projectId,
}: {
  dashboard: ProjectDashboard;
  projectId: string;
}) {
  const awaitingApproval = dashboard.awaiting_approval ?? [];
  const blockedOverdue = dashboard.blocked_overdue ?? [];

  if (awaitingApproval.length === 0 && blockedOverdue.length === 0) return null;

  return (
    <div className="mb-6 space-y-6">
      {awaitingApproval.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
            Awaiting your approval
          </h2>
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {awaitingApproval.map((task) => (
              <TaskRefRow key={task.id} task={task} projectId={projectId} />
            ))}
          </div>
        </div>
      )}

      {blockedOverdue.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3">
            Blocked / overdue
          </h2>
          <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
            {blockedOverdue.map((task) => (
              <TaskRefRow
                key={task.id}
                task={task}
                projectId={projectId}
                trailing={
                  task.assignees.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-content-muted shrink-0">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {task.assignees.join(", ")}
                    </span>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
