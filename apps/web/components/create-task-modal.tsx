"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError, type Task, type TaskPriority, type Member } from "@/lib/api";

export interface CreateTaskModalInitial {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  parent_id?: string;
  assignee_ids?: string[];
}

export function CreateTaskModal({
  projectId,
  members,
  tasks,
  initial,
  onClose,
  onCreated,
}: {
  projectId: string;
  members: Member[];
  tasks: Task[];
  initial?: CreateTaskModalInitial;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "none");
  const [dueDate, setDueDate] = useState("");
  const [parentId, setParentId] = useState(initial?.parent_id ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initial?.assignee_ids ?? []);
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

export function getMemberInitials(m: Member) {
  return m.email.substring(0, 2).toUpperCase();
}
