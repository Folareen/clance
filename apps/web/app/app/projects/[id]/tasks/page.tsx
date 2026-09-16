"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  List,
  Network,
  X,
  ChevronRight,
  Calendar,
  Users,
  Trash2,
  Upload,
  FileIcon,
  Image,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader, PageBody } from "@/components/page-header";
import {
  Button,
  Card,
  Input,
  Segmented,
  SegmentedItem,
  EmptyState,
  SkeletonRows,
  Alert,
} from "@/components/ui";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import {
  api,
  ApiError,
  type Task,
  type TaskDetail,
  type TaskStatus,
  type TaskPriority,
  type Member,
  type FileRecord,
  type Message,
} from "@/lib/api";
import { ConfirmModal } from "@/components/confirm-modal";
import { toast } from "@/components/toast";
import { CreateTaskModal, getMemberInitials } from "@/components/create-task-modal";

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  backlog: { label: "Backlog", icon: Circle, className: "text-content-muted" },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "text-info",
  },
  submitted: {
    label: "Submitted",
    icon: AlertCircle,
    className: "text-warning",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "text-success",
  },
};

// Fallback for any status value the frontend doesn't recognize yet (e.g. a
// new status added server-side before this page redeploys), so an unknown
// value degrades to a neutral badge instead of crashing the page.
const UNKNOWN_STATUS = { label: "Unknown", icon: Circle, className: "text-content-muted" };

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string } | null
> = {
  urgent: { label: "Urgent", className: "bg-danger-soft text-danger" },
  high: { label: "High", className: "bg-warning-soft text-warning" },
  medium: { label: "Medium", className: "bg-info-soft text-info" },
  low: { label: "Low", className: "bg-surface-hover text-content-muted" },
  none: null,
};

export default function ProjectTasks() {
  const { project } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [view, setView] = useState<"list" | "tree">("list");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectId = project?.id ?? "";

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listTasks(projectId, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const openTask = async (taskId: string) => {
    try {
      const detail = await api.getTask(projectId, taskId);
      setSelected(detail);
    } catch {}
  };

  const activeMembers =
    project?.members.filter((m) => m.status === "active") ?? [];

  const topLevel = tasks.filter((t) =>
    view === "tree" ? !t.parent_id : true
  );
  const childMap = new Map<string, Task[]>();
  if (view === "tree") {
    for (const t of tasks) {
      if (t.parent_id) {
        const list = childMap.get(t.parent_id) ?? [];
        list.push(t);
        childMap.set(t.parent_id, list);
      }
    }
  }

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const parentChain = (task: Task): Task[] => {
    const chain: Task[] = [];
    let current = task.parent_id ? taskById.get(task.parent_id) : undefined;
    while (current) {
      chain.unshift(current);
      current = current.parent_id ? taskById.get(current.parent_id) : undefined;
    }
    return chain;
  };

  const statusFilters = ["all", "backlog", "in_progress", "submitted", "approved"] as const;
  const filterLabel = (f: (typeof statusFilters)[number]) =>
    f === "all"
      ? "All"
      : f === "in_progress"
        ? "In progress"
        : f.charAt(0).toUpperCase() + f.slice(1);

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${tasks.length} task${tasks.length !== 1 ? "s" : ""} in this project`}
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            <span className="hidden sm:inline">New task</span>
            <span className="sm:hidden">New</span>
          </Button>
        }
        toolbar={
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="pl-9"
              />
            </div>

            <Segmented className="shrink-0">
              <SegmentedItem
                active={view === "list"}
                onClick={() => setView("list")}
                aria-label="List view"
                className="px-2"
              >
                <List className="w-4 h-4" />
              </SegmentedItem>
              <SegmentedItem
                active={view === "tree"}
                onClick={() => setView("tree")}
                aria-label="Tree view"
                className="px-2"
              >
                <Network className="w-4 h-4" />
              </SegmentedItem>
            </Segmented>
          </div>
        }
      />

      <PageBody>
        {/* Status filters: scroll horizontally on mobile rather than wrapping */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 mb-4 overflow-x-auto scroll-none">
          <Segmented className="w-max">
            {statusFilters.map((f) => (
              <SegmentedItem
                key={f}
                active={statusFilter === f}
                onClick={() => setStatusFilter(f)}
              >
                {filterLabel(f)}
              </SegmentedItem>
            ))}
          </Segmented>
        </div>

        {error && <Alert className="mb-4">{error}</Alert>}

        {loading ? (
          <SkeletonRows rows={6} />
        ) : tasks.length === 0 && !search && statusFilter === "all" ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create a task to start tracking work on this project."
            action={
              <Button icon={Plus} onClick={() => setShowCreate(true)}>
                New task
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden sm:grid grid-cols-[auto_1fr_120px_90px_90px_70px] gap-4 px-5 py-2.5 border-b border-stroke bg-surface-secondary/70 text-[11px] font-semibold text-content-muted uppercase tracking-wider">
            <div className="w-4" />
            <div>Task</div>
            <div>Status</div>
            <div>Assignee</div>
            <div>Priority</div>
            <div>Due</div>
          </div>

          <div className="divide-y divide-stroke-secondary">
              {topLevel.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  children={childMap.get(task.id)}
                  onClick={() => openTask(task.id)}
                  depth={0}
                  view={view}
                  onOpenChild={openTask}
                  parentChain={view === "list" ? parentChain(task) : undefined}
                />
              ))}
            </div>

            {topLevel.length === 0 && (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-content-secondary">
                  No tasks match your filters.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-2 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </Card>
        )}
      </PageBody>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          members={activeMembers}
          tasks={tasks}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadTasks();
          }}
        />
      )}

      {selected && (
        <TaskDetailPanel
          task={selected}
          projectId={projectId}
          members={activeMembers}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            loadTasks();
            if (selected) openTask(selected.id);
          }}
          onDeleted={() => {
            setSelected(null);
            loadTasks();
          }}
        />
      )}
    </>
  );
}

function TaskRow({
  task,
  children,
  onClick,
  depth,
  view,
  onOpenChild,
  parentChain,
}: {
  task: Task;
  children?: Task[];
  onClick: () => void;
  depth: number;
  view: string;
  onOpenChild: (id: string) => void;
  parentChain?: Task[];
}) {
  const status = statusConfig[task.status] ?? UNKNOWN_STATUS;
  const priority = priorityConfig[task.priority];
  const StatusIcon = status.icon;
  const initials = task.assignees?.[0]
    ? getInitials(task.assignees[0])
    : null;

  const dueStr = task.due_date ? formatDue(task.due_date) : null;
  const dueSoon = task.due_date ? isDueSoon(task.due_date) : false;

  return (
    <>
      <div
        onClick={onClick}
        className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_120px_90px_90px_70px] gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 items-center hover:bg-surface-hover/60 active:bg-surface-hover transition-colors cursor-pointer group"
        style={{ paddingLeft: `${20 + depth * 24}px` }}
      >
        <StatusIcon className={cn("w-4 h-4", status.className)} />
        <div className="min-w-0">
          {parentChain && parentChain.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-content-muted mb-0.5 truncate">
              {parentChain.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1 truncate">
                  {i > 0 && <ChevronRight className="w-2.5 h-2.5 shrink-0" />}
                  <span className="truncate">#{p.task_number} {p.title}</span>
                </span>
              ))}
              <ChevronRight className="w-2.5 h-2.5 shrink-0" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-muted font-mono">
              #{task.task_number}
            </span>
            <span className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 sm:hidden">
            <span className={cn("text-[11px] font-semibold", status.className)}>
              {status.label}
            </span>
            {priority && (
              <span
                className={cn(
                  "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold",
                  priority.className
                )}
              >
                {priority.label}
              </span>
            )}
            {dueStr && (
              <span
                className={cn(
                  "text-[11px] tabular-nums ml-auto",
                  dueSoon ? "text-danger font-semibold" : "text-content-muted"
                )}
              >
                {dueStr}
              </span>
            )}
            {task.assignees?.length > 0 && (
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((a) => (
                  <span
                    key={a.member_id}
                    className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center text-[9px] font-semibold text-accent border border-surface"
                  >
                    {getInitials(a)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <span
          className={cn(
            "hidden sm:inline-flex text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
        <div className="hidden sm:flex items-center">
          {initials ? (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((a) => (
                <div
                  key={a.member_id}
                  className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center text-[10px] font-semibold text-accent border-2 border-surface"
                  title={a.email}
                >
                  {getInitials(a)}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-medium text-content-muted border-2 border-surface">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-content-muted italic">Open</span>
          )}
        </div>
        <div className="hidden sm:block">
          {priority && (
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded text-[11px] font-medium",
                priority.className
              )}
            >
              {priority.label}
            </span>
          )}
        </div>
        <span
          className={cn(
            "hidden sm:block text-sm tabular-nums",
            dueSoon ? "text-danger font-medium" : "text-content-secondary"
          )}
        >
          {dueStr ?? "—"}
        </span>
      </div>
      {view === "tree" &&
        children?.map((child) => (
          <TaskRow
            key={child.id}
            task={child}
            onClick={() => onOpenChild(child.id)}
            depth={depth + 1}
            view={view}
            onOpenChild={onOpenChild}
          />
        ))}
    </>
  );
}

function TaskDetailPanel({
  task,
  projectId,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: TaskDetail;
  projectId: string;
  members: Member[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<FileRecord | null>(null);
  const [deletingFileBusy, setDeletingFileBusy] = useState(false);
  const [comments, setComments] = useState<Message[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [pendingRejectStatus, setPendingRejectStatus] = useState<TaskStatus | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // Escape closes the panel; lock the page behind it while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [onClose]);

  const { user } = useAuth();
  const isAssignee = task.assignees.some((a) => a.user_id === user?.id);
  const canSubmit = isAssignee || task.created_by === user?.id;
  const me = members.find((m) => m.user_id === user?.id);
  const isManager = me?.role === "manager";
  const canDeleteTask = isManager || task.created_by === user?.id;

  const loadFiles = useCallback(async () => {
    try {
      const data = await api.listTaskFiles(projectId, task.id);
      setFiles(data);
    } catch {}
  }, [projectId, task.id]);

  const loadComments = useCallback(async () => {
    try {
      const data = await api.getComments(projectId, task.id);
      setComments(data.messages);
    } catch {}
  }, [projectId, task.id]);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setEditing(false);
    loadFiles();
    loadComments();
  }, [task, loadFiles, loadComments]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateTask(projectId, task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save task");
    }
    setSaving(false);
  };

  const handleStatusChange = async (status: TaskStatus) => {
    const isRejection =
      (task.status === "submitted" || task.status === "approved") &&
      status !== "approved";

    if (isRejection) {
      setPendingRejectStatus(status);
      return;
    }

    setSavingStatus(true);
    try {
      await api.updateTask(projectId, task.id, { status });
      onUpdated();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update status");
    }
    setSavingStatus(false);
  };

  const confirmReject = async () => {
    if (!pendingRejectStatus || !rejectComment.trim()) return;
    setSavingStatus(true);
    try {
      await api.updateTask(projectId, task.id, {
        status: pendingRejectStatus,
        comment: rejectComment.trim(),
      });
      setPendingRejectStatus(null);
      setRejectComment("");
      onUpdated();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update status");
    }
    setSavingStatus(false);
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    setSavingPriority(true);
    try {
      await api.updateTask(projectId, task.id, { priority });
      onUpdated();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update priority");
    }
    setSavingPriority(false);
  };

  const handleAssign = async (memberIds: string[]) => {
    try {
      await api.assignTask(projectId, task.id, memberIds);
      setShowAssign(false);
      onUpdated();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to update assignees");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteTask(projectId, task.id);
      onDeleted();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete task");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await api.uploadTaskFile(projectId, task.id, file);
      }
      await loadFiles();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to upload file");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteFile = async () => {
    if (!deletingFile) return;
    setDeletingFileBusy(true);
    try {
      await api.deleteFile(projectId, task.id, deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      setDeletingFile(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete file");
    }
    setDeletingFileBusy(false);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    setSendingComment(true);
    try {
      const msg = await api.sendComment(projectId, task.id, commentInput.trim());
      setComments((prev) => [...prev, msg]);
      setCommentInput("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to send comment");
    }
    setSendingComment(false);
  };

  const status = statusConfig[task.status] ?? UNKNOWN_STATUS;
  const StatusIcon = status.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Task #${task.task_number}`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-surface flex flex-col w-full sm:max-w-xl shadow-xl",
          "mt-10 sm:mt-0 h-[calc(100%-2.5rem)] sm:h-full",
          "rounded-t-2xl sm:rounded-none sm:border-l border-stroke",
          "animate-sheet-in sm:animate-slide-in-right"
        )}
      >
        {/* Grab handle, mobile only */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-9 h-1 rounded-full bg-stroke" />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-stroke shrink-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="font-mono text-content-muted shrink-0">
              #{task.task_number}
            </span>
            <StatusIcon className={cn("w-4 h-4 shrink-0", status.className)} />
            <span className={cn("font-medium truncate", status.className)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canDeleteTask && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete task"
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-danger-soft text-content-muted hover:text-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center w-9 h-9 -mr-1.5 rounded-lg hover:bg-surface-hover text-content-muted hover:text-content transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-none-touch scroll-thin flex-1 flex flex-col">
        <div className="p-4 sm:p-6 space-y-6 shrink-0">
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-semibold text-content bg-transparent border-b border-stroke focus:outline-none focus:border-accent pb-1"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add details..."
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-contrast hover:bg-accent-hover"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setTitle(task.title);
                    setDescription(task.description ?? "");
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-content-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer group"
              onClick={() => setEditing(true)}
            >
              <h2 className="text-xl font-semibold text-content group-hover:text-accent transition-colors">
                {task.title}
              </h2>
              {task.description && (
                <p className="text-sm text-content-secondary mt-2 leading-relaxed">
                  {task.description}
                </p>
              )}
              {!task.description && (
                <p className="text-sm text-content-muted mt-2 italic">
                  Click to add description...
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
                Status
              </label>
              <div className="relative">
                <select
                  value={task.status}
                  disabled={savingStatus}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as TaskStatus)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                >
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted" disabled={!canSubmit}>
                    Submitted{!canSubmit ? " (assignees only)" : ""}
                  </option>
                  <option value="approved" disabled={!isManager}>
                    Approved{!isManager ? " (managers only)" : ""}
                  </option>
                </select>
                {savingStatus && (
                  <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-content-muted" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
                Priority
              </label>
              <div className="relative">
                <select
                  value={task.priority}
                  disabled={savingPriority}
                  onChange={(e) =>
                    handlePriorityChange(e.target.value as TaskPriority)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {savingPriority && (
                  <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-content-muted" />
                )}
              </div>
            </div>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <Calendar className="w-4 h-4" />
              <span>Due {formatDue(task.due_date)}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                Assignees
              </label>
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="text-xs text-accent hover:text-accent-hover font-medium"
              >
                <Users className="w-3.5 h-3.5 inline mr-1" />
                {showAssign ? "Done" : "Edit"}
              </button>
            </div>
            {showAssign ? (
              <AssigneePicker
                members={members}
                selected={task.assignees.map((a) => a.member_id)}
                onChange={handleAssign}
              />
            ) : task.assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((a) => (
                  <div
                    key={a.member_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-secondary text-xs font-medium text-content"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center text-[9px] font-semibold text-accent">
                      {getInitials(a)}
                    </div>
                    {a.first_name
                      ? `${a.first_name} ${a.last_name ?? ""}`.trim()
                      : a.email}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-content-muted italic">Unassigned</p>
            )}
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
                Subtasks ({task.subtasks.length})
              </label>
              <div className="space-y-1">
                {task.subtasks.map((sub: any) => {
                  const s = statusConfig[sub.status as TaskStatus] ?? UNKNOWN_STATUS;
                  const Icon = s.icon;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
                    >
                      <Icon className={cn("w-3.5 h-3.5", s.className)} />
                      <span className="text-xs text-content-muted font-mono">
                        #{sub.task_number}
                      </span>
                      <span className="text-content">{sub.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                Attachments {files.length > 0 && `(${files.length})`}
              </label>
              <label className="text-xs text-accent hover:text-accent-hover font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((f) => {
                  const isImage = f.mimetype?.startsWith("image/");
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary group"
                    >
                      {isImage ? (
                        <Image className="w-4 h-4 text-info shrink-0" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-content-muted shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-content hover:text-accent transition-colors truncate block"
                        >
                          {f.filename}
                        </a>
                        <span className="text-xs text-content-muted">
                          {f.size ? formatFileSize(f.size) : ""}
                        </span>
                      </div>
                      {(isManager || f.uploaded_by === user?.id) && (
                        <button
                          onClick={() => setDeletingFile(f)}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-danger-soft text-content-muted hover:text-danger transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-content-muted italic">No attachments</p>
            )}
          </div>

          </div>
          <div className="flex flex-col flex-1 min-h-0 px-6 pb-6 pt-2">
            <label className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-3 shrink-0">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
              Comments {comments.length > 0 && `(${comments.length})`}
            </label>
            <div className="space-y-3 mb-3 flex-1 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center text-[10px] font-semibold text-accent shrink-0 mt-0.5">
                    {c.sender.first_name
                      ? (c.sender.first_name.charAt(0) + (c.sender.last_name?.charAt(0) ?? "")).toUpperCase()
                      : c.sender.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-content">
                        {c.sender.first_name
                          ? `${c.sender.first_name} ${c.sender.last_name ?? ""}`.trim()
                          : c.sender.email}
                      </span>
                      <span className="text-[11px] text-content-muted">
                        {new Date(c.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-content-secondary mt-0.5 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                onClick={handleSendComment}
                disabled={!commentInput.trim() || sendingComment}
                className="p-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete task"
          message={`Delete task #${task.task_number} "${task.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deletingFile && (
        <ConfirmModal
          title="Delete file"
          message={`Delete "${deletingFile.filename}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deletingFileBusy}
          onConfirm={handleDeleteFile}
          onCancel={() => setDeletingFile(null)}
        />
      )}

      {pendingRejectStatus && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => {
            setPendingRejectStatus(null);
            setRejectComment("");
          }}
        >
          <div
            className="w-full max-w-sm bg-surface border border-stroke rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-content mb-1">
              Send back to {pendingRejectStatus.replace("_", " ")}
            </h3>
            <p className="text-sm text-content-secondary mb-3">
              Let them know what needs to change.
            </p>
            <textarea
              autoFocus
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="What needs revision..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPendingRejectStatus(null);
                  setRejectComment("");
                }}
                disabled={savingStatus}
                className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={savingStatus || !rejectComment.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-contrast hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingStatus ? "Sending..." : "Send back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssigneePicker({
  members,
  selected,
  onChange,
}: {
  members: Member[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>(selected);

  const toggle = (memberId: string) => {
    const next = ids.includes(memberId)
      ? ids.filter((id) => id !== memberId)
      : [...ids, memberId];
    setIds(next);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => toggle(m.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            ids.includes(m.id)
              ? "border-accent bg-accent-soft text-accent"
              : "border-stroke text-content-secondary hover:border-accent/40"
          )}
        >
          <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center text-[9px] font-semibold text-accent">
            {getMemberInitials(m)}
          </div>
          {m.email}
        </button>
      ))}
    </div>
  );
}

function getInitials(a: { first_name?: string | null; last_name?: string | null; email: string }) {
  if (a.first_name) {
    return (
      a.first_name.charAt(0) + (a.last_name?.charAt(0) ?? "")
    ).toUpperCase();
  }
  return a.email.charAt(0).toUpperCase();
}

function formatDue(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueSoon(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours < 24 && hours > -48;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
