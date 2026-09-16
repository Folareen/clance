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
  ListChecks,
  CalendarClock,
  MessageCircle,
  Video,
  Sparkles,
} from "lucide-react";
import { ProjectAvatar } from "@/components/project-avatar";
import { PageHeader, PageBody, SectionLabel } from "@/components/page-header";
import {
  Button,
  Card,
  Badge,
  Stat,
  Progress,
  EmptyState,
  Skeleton,
  SkeletonRows,
} from "@/components/ui";
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
  const loading = dashboard === null;

  const total = dashboard?.total_tasks ?? 0;
  const approved = dashboard?.tasks_by_status.approved ?? 0;
  const pct = total > 0 ? (approved / total) * 100 : 0;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5 min-w-0">
            <ProjectAvatar project={project} size={28} className="rounded-lg shrink-0" />
            <span className="truncate">{project.name}</span>
          </span>
        }
        description={project.description || "No description yet."}
        actions={
          me?.role === "manager" ? (
            <Link href={`/app/projects/${project.id}/settings`}>
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
                Manage
              </Button>
            </Link>
          ) : null
        }
        eyebrow={
          <span className="flex items-center gap-2">
            <span>Overview</span>
            {me && (
              <Badge tone={me.role === "manager" ? "accent" : "neutral"}>
                {me.role}
              </Badge>
            )}
          </span>
        }
      />

      <PageBody className="space-y-6">
        {/* Progress + stats */}
        {loading ? (
          <Card className="p-5">
            <Skeleton className="h-4 w-32 rounded mb-4" />
            <Skeleton className="h-1.5 w-full rounded-full mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-7 w-10 rounded" />
                </div>
              ))}
            </div>
          </Card>
        ) : total > 0 ? (
          <Card>
            <div className="p-5 pb-4 border-b border-stroke-secondary">
              <div className="flex items-end justify-between gap-4 mb-2.5">
                <div>
                  <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                    Progress
                  </p>
                  <p className="text-sm text-content-secondary mt-1">
                    {approved} of {total} task{total !== 1 ? "s" : ""} approved
                  </p>
                </div>
                <span className="text-2xl font-semibold text-content tabular-nums leading-none">
                  {Math.round(pct)}%
                </span>
              </div>
              <Progress value={pct} tone={pct === 100 ? "success" : "accent"} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-stroke-secondary">
              <Stat
                label="Backlog"
                value={dashboard.tasks_by_status.backlog}
                icon={Circle}
              />
              <Stat
                label="In progress"
                value={dashboard.tasks_by_status.in_progress}
                icon={Clock}
                tone="info"
              />
              <Stat
                label="Submitted"
                value={dashboard.tasks_by_status.submitted}
                icon={AlertCircle}
                tone="warning"
              />
              <Stat
                label="Overdue"
                value={dashboard.overdue_tasks}
                icon={CalendarClock}
                tone={dashboard.overdue_tasks > 0 ? "danger" : "neutral"}
              />
            </div>
          </Card>
        ) : null}

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Tasks", href: `/app/projects/${project.id}/tasks`, icon: ListChecks },
            { name: "Chat", href: `/app/projects/${project.id}/chat`, icon: MessageCircle },
            { name: "Meetings", href: `/app/projects/${project.id}/meetings`, icon: Video },
            { name: "Assistant", href: `/app/projects/${project.id}/assistant`, icon: Sparkles },
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-stroke bg-surface shadow-xs hover:border-accent/40 hover:bg-surface-hover transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                <link.icon className="w-4 h-4 text-accent" />
              </span>
              <span className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Role-specific widgets */}
        {loading ? (
          <div>
            <SectionLabel>Loading</SectionLabel>
            <SkeletonRows rows={3} />
          </div>
        ) : (
          <>
            {dashboard.role === "manager" && (
              <ManagerWidgets dashboard={dashboard} projectId={project.id} />
            )}
            {dashboard.role === "worker" && (
              <WorkerWidgets
                dashboard={dashboard}
                projectId={project.id}
                onChanged={loadDashboard}
              />
            )}

            {dashboard.recent_tasks.length > 0 && (
              <div>
                <SectionLabel
                  action={
                    <Link
                      href={`/app/projects/${project.id}/tasks`}
                      className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                    >
                      View all
                    </Link>
                  }
                >
                  Recently updated
                </SectionLabel>
                <Card className="overflow-hidden divide-y divide-stroke-secondary">
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
                        className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-surface-hover/60 transition-colors group"
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", cfg.className)} />
                        <span className="text-xs text-content-muted font-mono shrink-0">
                          #{task.task_number}
                        </span>
                        <span className="text-sm font-medium text-content truncate flex-1 group-hover:text-accent transition-colors">
                          {task.title}
                        </span>
                        {task.due_date && (
                          <span
                            className={cn(
                              "text-xs shrink-0 tabular-nums",
                              overdue ? "text-danger font-medium" : "text-content-secondary"
                            )}
                          >
                            {formatDue(task.due_date)}
                          </span>
                        )}
                        <Badge
                          tone={
                            task.status === "approved"
                              ? "success"
                              : task.status === "submitted"
                                ? "warning"
                                : task.status === "in_progress"
                                  ? "info"
                                  : "neutral"
                          }
                          className="hidden sm:inline-flex"
                        >
                          {cfg.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </Card>
              </div>
            )}

            {total === 0 && (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Create your first task to start tracking work on this project."
                action={
                  <Link href={`/app/projects/${project.id}/tasks`}>
                    <Button icon={Plus}>Go to Tasks</Button>
                  </Link>
                }
              />
            )}
          </>
        )}
      </PageBody>
    </>
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
      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-surface-hover/60 transition-colors group"
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
        <span
          className={cn(
            "text-xs shrink-0 tabular-nums",
            overdue ? "text-danger font-medium" : "text-content-secondary"
          )}
        >
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
    <div className="space-y-6">
      {awaitingAction.length > 0 && (
        <div>
          <SectionLabel>Awaiting your action</SectionLabel>
          <Card className="overflow-hidden divide-y divide-stroke-secondary">
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
                    className="flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-accent-soft text-xs font-semibold text-accent hover:bg-accent-soft-hover transition-colors shrink-0 disabled:opacity-60 press"
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
          </Card>
        </div>
      )}

      <div>
        <SectionLabel>My pending tasks</SectionLabel>
        <Card className="overflow-hidden divide-y divide-stroke-secondary">
          {pending.map((task) => (
            <TaskRefRow key={task.id} task={task} projectId={projectId} />
          ))}
        </Card>
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
    <div className="space-y-6">
      {awaitingApproval.length > 0 && (
        <div>
          <SectionLabel>Awaiting your approval</SectionLabel>
          <Card className="overflow-hidden divide-y divide-stroke-secondary">
            {awaitingApproval.map((task) => (
              <TaskRefRow key={task.id} task={task} projectId={projectId} />
            ))}
          </Card>
        </div>
      )}

      {blockedOverdue.length > 0 && (
        <div>
          <SectionLabel>Blocked / overdue</SectionLabel>
          <Card className="overflow-hidden divide-y divide-stroke-secondary">
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
          </Card>
        </div>
      )}
    </div>
  );
}
