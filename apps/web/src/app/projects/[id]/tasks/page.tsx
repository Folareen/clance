"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "backlog" | "in_progress" | "submitted" | "approved";
type Priority = "urgent" | "high" | "medium" | "low" | "none";

const statusConfig: Record<Status, { label: string; icon: typeof Circle; className: string }> = {
  backlog: { label: "Backlog", icon: Circle, className: "text-content-muted" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-info" },
  submitted: { label: "Submitted", icon: AlertCircle, className: "text-warning" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-success" },
};

const priorityConfig: Record<Priority, { label: string; className: string } | null> = {
  urgent: { label: "Urgent", className: "bg-danger-soft text-danger" },
  high: { label: "High", className: "bg-warning-soft text-warning" },
  medium: { label: "Medium", className: "bg-info-soft text-info" },
  low: { label: "Low", className: "bg-surface-hover text-content-muted" },
  none: null,
};

const tasks = [
  { id: "CLN-42", title: "User authentication flow", status: "in_progress" as Status, priority: "urgent" as Priority, assignee: "SA", due: "Today", dueSoon: true },
  { id: "CLN-41", title: "Set up payment gateway integration", status: "in_progress" as Status, priority: "high" as Priority, assignee: "AK", due: "Tomorrow", dueSoon: true },
  { id: "CLN-40", title: "Design system color tokens", status: "submitted" as Status, priority: "medium" as Priority, assignee: "EW", due: "Jun 25", dueSoon: false },
  { id: "CLN-39", title: "Landing page hero section", status: "approved" as Status, priority: "high" as Priority, assignee: "SC", due: "Jun 20", dueSoon: false },
  { id: "CLN-38", title: "API rate limiting middleware", status: "in_progress" as Status, priority: "medium" as Priority, assignee: "MJ", due: "Jun 26", dueSoon: false },
  { id: "CLN-37", title: "Onboarding email templates", status: "backlog" as Status, priority: "low" as Priority, assignee: "LP", due: "Jun 30", dueSoon: false },
  { id: "CLN-36", title: "Push notification service", status: "backlog" as Status, priority: "medium" as Priority, assignee: null, due: "Jul 2", dueSoon: false },
  { id: "CLN-34", title: "Database migration scripts", status: "approved" as Status, priority: "urgent" as Priority, assignee: "AK", due: "Jun 18", dueSoon: false },
];

export default function ProjectTasks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [view, setView] = useState<"list" | "tree">("list");

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Tasks</h1>
          <p className="text-content-secondary mt-1">{tasks.length} tasks in this project</p>
        </div>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface border border-stroke rounded-lg p-0.5">
          {(["all", "backlog", "in_progress", "submitted", "approved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                statusFilter === s
                  ? "bg-accent text-accent-contrast"
                  : "text-content-secondary hover:text-content hover:bg-surface-hover"
              )}
            >
              {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface border border-stroke rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setView("list")}
            className={cn("p-1.5 rounded-md transition-colors", view === "list" ? "bg-accent text-accent-contrast" : "text-content-secondary hover:text-content")}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("tree")}
            className={cn("p-1.5 rounded-md transition-colors", view === "tree" ? "bg-accent text-accent-contrast" : "text-content-secondary hover:text-content")}
          >
            <Network className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-surface border border-stroke rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[auto_1fr_120px_90px_90px_70px] gap-4 px-5 py-3 border-b border-stroke bg-surface-secondary text-xs font-medium text-content-muted uppercase tracking-wider">
          <div className="w-4" />
          <div>Task</div>
          <div>Status</div>
          <div>Assignee</div>
          <div>Priority</div>
          <div>Due</div>
        </div>

        <div className="divide-y divide-stroke-secondary">
          {filtered.map((task) => {
            const status = statusConfig[task.status];
            const priority = priorityConfig[task.priority];
            const StatusIcon = status.icon;
            return (
              <div
                key={task.id}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_120px_90px_90px_70px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 items-center hover:bg-surface-hover/50 transition-colors cursor-pointer group"
              >
                <StatusIcon className={cn("w-4 h-4", status.className)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-content-muted font-mono">{task.id}</span>
                    <span className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                    <span className={cn("text-xs font-medium", status.className)}>{status.label}</span>
                    {priority && (
                      <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium", priority.className)}>
                        {priority.label}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn("hidden sm:inline-flex text-xs font-medium", status.className)}>{status.label}</span>
                <div className="hidden sm:flex items-center">
                  {task.assignee ? (
                    <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center text-[10px] font-semibold text-accent">
                      {task.assignee}
                    </div>
                  ) : (
                    <span className="text-xs text-content-muted italic">Open</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  {priority && (
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-medium", priority.className)}>
                      {priority.label}
                    </span>
                  )}
                </div>
                <span className={cn("hidden sm:block text-sm", task.dueSoon ? "text-danger font-medium" : "text-content-secondary")}>
                  {task.due}
                </span>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-content-muted">No tasks match your filters.</div>
        )}
      </div>
    </div>
  );
}
