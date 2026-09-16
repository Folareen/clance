"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Plus, ExternalLink, Loader2, CheckSquare, X, Pencil, Trash2 } from "lucide-react";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, PageBody } from "@/components/page-header";
import { Button, Card, EmptyState, SkeletonRows, Alert } from "@/components/ui";
import { toast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";
import { api, ApiError, type Meeting, type Task } from "@/lib/api";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today at ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`;
}

function creatorName(creator: Meeting["creator"]) {
  const name = [creator.first_name, creator.last_name].filter(Boolean).join(" ");
  return name || creator.email || "Someone";
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProjectMeetings() {
  const { project } = useProject();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [deleting, setDeleting] = useState<Meeting | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = project?.id ?? "";
  const me = project?.members.find((m) => m.user_id === user?.id);
  const canManage = (m: Meeting) =>
    me?.role === "manager" || m.created_by === user?.id;

  const loadMeetings = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listMeetings(projectId);
      setMeetings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meetings");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.deleteMeeting(projectId, deleting.id);
      setDeleting(null);
      loadMeetings();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete meeting");
    }
    setDeletingBusy(false);
  };

  return (
    <>
      <PageHeader
        title="Meetings"
        description="Keep a log of your project's meetings, notes, and links"
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            <span className="hidden sm:inline">Log meeting</span>
            <span className="sm:hidden">Log</span>
          </Button>
        }
      />

      <PageBody>
        {error && <Alert className="mb-4">{error}</Alert>}

        {loading ? (
          <SkeletonRows rows={4} />
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No meetings yet"
            description="Log a meeting to keep a record of it here, tied to the activity log."
            action={
              <Button icon={Plus} onClick={() => setShowCreate(true)}>
                Log a meeting
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden divide-y divide-stroke-secondary">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-3.5 px-4 sm:px-5 py-4 hover:bg-surface-hover/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content truncate">{m.title}</p>
                <p className="text-xs text-content-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Logged by {creatorName(m.creator)}</span>
                  <span>&middot;</span>
                  <span>{formatDateTime(m.happened_at)}</span>
                  {m.task_title && (
                    <>
                      <span>&middot;</span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />#{m.task_number} {m.task_title}
                      </span>
                    </>
                  )}
                </p>
                {m.notes && (
                  <p className="text-sm text-content-secondary mt-2 whitespace-pre-wrap">{m.notes}</p>
                )}
                {m.join_url && (
                  <a
                    href={m.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline mt-2"
                  >
                    Join link
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {canManage(m) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditing(m)}
                    title="Edit"
                    className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-hover transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(m)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-content-muted hover:text-danger hover:bg-danger-soft transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          </Card>
        )}
      </PageBody>

      {showCreate && (
        <MeetingModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            loadMeetings();
          }}
        />
      )}

      {editing && (
        <MeetingModal
          projectId={projectId}
          meeting={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadMeetings();
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete meeting"
          message={`Delete "${deleting.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deletingBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}

function MeetingModal({
  projectId,
  meeting,
  onClose,
  onSaved,
}: {
  projectId: string;
  meeting?: Meeting;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!meeting;
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [happenedAt, setHappenedAt] = useState(
    meeting ? toLocalInputValue(meeting.happened_at) : toLocalInputValue(new Date().toISOString()),
  );
  const [joinUrl, setJoinUrl] = useState(meeting?.join_url ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");
  const [taskId, setTaskId] = useState(meeting?.task_id ?? "");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .listTasks(projectId)
      .then(setTasks)
      .catch(() => {});
  }, [projectId]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        happened_at: new Date(happenedAt).toISOString(),
        join_url: joinUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEditing) {
        await api.updateMeeting(projectId, meeting.id, { ...payload, task_id: taskId || null });
      } else {
        await api.createMeeting(projectId, { ...payload, task_id: taskId || undefined });
      }
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save meeting");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface border border-stroke rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-content">
            {isEditing ? "Edit meeting" : "Log a meeting"}
          </h3>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block text-sm font-medium text-content mb-1.5">
          What was it about?
        </label>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekly sync"
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all mb-4"
        />

        <label className="block text-sm font-medium text-content mb-1.5">When</label>
        <input
          type="datetime-local"
          value={happenedAt}
          onChange={(e) => setHappenedAt(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all mb-4"
        />

        <label className="block text-sm font-medium text-content mb-1.5">
          Related task <span className="text-content-muted font-normal">(optional)</span>
        </label>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all mb-4"
        >
          <option value="">No task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.task_number} {t.title}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-content mb-1.5">
          Meeting link <span className="text-content-muted font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="https://meet.google.com/xxx-yyyy-zzz"
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all mb-4"
        />

        <label className="block text-sm font-medium text-content mb-1.5">
          Notes <span className="text-content-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was discussed, decisions made..."
          rows={3}
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all mb-4 resize-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Save" : "Log meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
