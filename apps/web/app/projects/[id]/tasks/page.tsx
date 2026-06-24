"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  Network,
  X,
  ChevronRight,
  Calendar,
  Users,
  Trash2,
  Paperclip,
  Upload,
  FileIcon,
  Image,
  Send,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Tasks</h1>
          <p className="text-content-secondary mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} in this project
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
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
          {(
            ["all", "backlog", "in_progress", "submitted", "approved"] as const
          ).map((s) => (
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
              {s === "all"
                ? "All"
                : s === "in_progress"
                  ? "In Progress"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface border border-stroke rounded-lg p-0.5 ml-auto">
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "list"
                ? "bg-accent text-accent-contrast"
                : "text-content-secondary hover:text-content"
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("tree")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "tree"
                ? "bg-accent text-accent-contrast"
                : "text-content-secondary hover:text-content"
            )}
          >
            <Network className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-content-muted">
          Loading tasks...
        </div>
      ) : (
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
            {topLevel.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                children={childMap.get(task.id)}
                onClick={() => openTask(task.id)}
                depth={0}
                view={view}
                onOpenChild={openTask}
              />
            ))}
          </div>

          {topLevel.length === 0 && (
            <div className="px-5 py-12 text-center text-content-muted">
              {search || statusFilter !== "all"
                ? "No tasks match your filters."
                : "No tasks yet. Create one to get started."}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}

function TaskRow({
  task,
  children,
  onClick,
  depth,
  view,
  onOpenChild,
}: {
  task: Task;
  children?: Task[];
  onClick: () => void;
  depth: number;
  view: string;
  onOpenChild: (id: string) => void;
}) {
  const status = statusConfig[task.status];
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
        className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_120px_90px_90px_70px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 items-center hover:bg-surface-hover/50 transition-colors cursor-pointer group"
        style={{ paddingLeft: `${20 + depth * 24}px` }}
      >
        <StatusIcon className={cn("w-4 h-4", status.className)} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-content-muted font-mono">
              #{task.task_number}
            </span>
            <span className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:hidden">
            <span className={cn("text-xs font-medium", status.className)}>
              {status.label}
            </span>
            {priority && (
              <span
                className={cn(
                  "inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium",
                  priority.className
                )}
              >
                {priority.label}
              </span>
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
            "hidden sm:block text-sm",
            dueSoon ? "text-danger font-medium" : "text-content-secondary"
          )}
        >
          {dueStr ?? ""}
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

function CreateTaskModal({
  projectId,
  members,
  tasks,
  onClose,
  onCreated,
}: {
  projectId: string;
  members: Member[];
  tasks: Task[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [parentId, setParentId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        parent_id: parentId || undefined,
        assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignee = (memberId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-stroke rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke">
          <h2 className="text-lg font-semibold text-content">New Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-hover text-content-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details..."
              className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          {tasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-content mb-1">
                Parent Task
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="">None (top-level)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.task_number} — {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-content mb-1">
                Assignees
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      assigneeIds.includes(m.id)
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
            </div>
          )}

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const [showAssign, setShowAssign] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState<Message[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

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
    } catch {}
    setSaving(false);
  };

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      await api.updateTask(projectId, task.id, { status });
      onUpdated();
    } catch {}
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    try {
      await api.updateTask(projectId, task.id, { priority });
      onUpdated();
    } catch {}
  };

  const handleAssign = async (memberIds: string[]) => {
    try {
      await api.assignTask(projectId, task.id, memberIds);
      setShowAssign(false);
      onUpdated();
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.deleteTask(projectId, task.id);
      onDeleted();
    } catch {}
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
    } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.deleteFile(projectId, task.id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {}
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    setSendingComment(true);
    try {
      const msg = await api.sendComment(projectId, task.id, commentInput.trim());
      setComments((prev) => [...prev, msg]);
      setCommentInput("");
    } catch {}
    setSendingComment(false);
  };

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-surface w-full max-w-xl h-full flex flex-col border-l border-stroke">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke bg-surface z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-content-muted">
            <span className="font-mono">#{task.task_number}</span>
            <ChevronRight className="w-3 h-3" />
            <StatusIcon className={cn("w-4 h-4", status.className)} />
            <span className={status.className}>{status.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md hover:bg-danger-soft text-content-muted hover:text-danger transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-hover text-content-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col">
        <div className="p-6 space-y-6 shrink-0">
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
              <select
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as TaskStatus)
                }
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) =>
                  handlePriorityChange(e.target.value as TaskPriority)
                }
                className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
                  const s = statusConfig[sub.status as TaskStatus];
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
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-danger-soft text-content-muted hover:text-danger transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

function getMemberInitials(m: Member) {
  return m.email.substring(0, 2).toUpperCase();
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
