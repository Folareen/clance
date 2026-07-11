"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Plus, ExternalLink, Loader2, CheckSquare, X } from "lucide-react";
import { useProject } from "@/components/project-provider";
import { PagePlaceholder } from "@/components/page-placeholder";
import { toast } from "@/components/toast";
import { api, ApiError, type Meeting, type Member } from "@/lib/api";

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

export default function ProjectMeetings() {
  const { project } = useProject();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const projectId = project?.id ?? "";

  const loadMeetings = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listMeetings(projectId);
      setMeetings(data);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Meetings</h1>
          <p className="text-content-secondary mt-1">
            Video calls, logged and tied to your project
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <PagePlaceholder
          icon={Video}
          title="No meetings yet"
          description="Start a meeting and it'll show up here, tied to the activity log."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Start a meeting
            </button>
          }
        />
      ) : (
        <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
          {meetings.map((m) => (
            <a
              key={m.id}
              href={m.join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content group-hover:text-accent transition-colors truncate">
                  {m.title}
                </p>
                <p className="text-xs text-content-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Started by {creatorName(m.creator)}</span>
                  <span>&middot;</span>
                  <span>{formatDateTime(m.created_at)}</span>
                  {m.task_title && (
                    <>
                      <span>&middot;</span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />#{m.task_number} {m.task_title}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent shrink-0">
                Join
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateMeetingModal
          projectId={projectId}
          members={project?.members.filter((m) => m.status === "active") ?? []}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadMeetings();
          }}
        />
      )}
    </div>
  );
}

function CreateMeetingModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  members: Member[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const meeting = await api.createMeeting(projectId, { title: title.trim() });
      onCreated();
      window.open(meeting.join_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to start meeting");
      setCreating(false);
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
          <h3 className="text-base font-semibold text-content">New meeting</h3>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="block text-sm font-medium text-content mb-1.5">
          What&apos;s it about?
        </label>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Weekly sync"
          className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Start &amp; join
          </button>
        </div>
      </div>
    </div>
  );
}
