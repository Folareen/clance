"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Loader2,
  CheckSquare,
  UserPlus,
  UserMinus,
  UserCog,
  Pin,
  PinOff,
  Paperclip,
  Video,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useProject } from "@/components/project-provider";
import { PagePlaceholder } from "@/components/page-placeholder";
import { api, ApiError, type ActivityEntry, type ActivityType } from "@/lib/api";
import { cn } from "@/lib/utils";

const activityIcons: Record<ActivityType, LucideIcon> = {
  task_created: CheckSquare,
  task_status_changed: CheckSquare,
  task_assigned: CheckSquare,
  task_deleted: CheckSquare,
  note_pinned: Pin,
  note_unpinned: PinOff,
  file_uploaded: Paperclip,
  meeting_created: Video,
  message_pinned: MessageSquare,
  member_invited: UserPlus,
  member_joined: UserPlus,
  member_removed: UserMinus,
  member_role_changed: UserCog,
  project_updated: Settings,
};

function actorName(actor: ActivityEntry["actor"]) {
  if (!actor) return "Someone";
  const name = [actor.first_name, actor.last_name].filter(Boolean).join(" ");
  return name || actor.email || "Someone";
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = diff / (1000 * 60);
  const hours = minutes / 60;

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ProjectActivity() {
  const { project } = useProject();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = project?.id ?? "";

  const loadActivity = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listActivity(projectId);
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load activity");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-content">Activity Log</h1>
        <p className="text-content-secondary mt-1">
          Every status change, approval, edit, and upload — timestamped
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <PagePlaceholder
          icon={Activity}
          title="Activity will appear here"
          description="A running record of everything that happens in this project, visible to managers and workers alike."
        />
      ) : (
        <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke-secondary overflow-hidden">
          {entries.map((entry) => {
            const Icon = activityIcons[entry.type] ?? Activity;
            const body = (
              <div className="flex items-start gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-content-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content">
                    <span className="font-medium">{actorName(entry.actor)}</span>{" "}
                    <span className="text-content-secondary">{entry.summary}</span>
                  </p>
                  {entry.body && (
                    <p className="text-sm text-content-muted mt-1 italic border-l-2 border-stroke-secondary pl-2.5">
                      &ldquo;{entry.body}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-content-muted mt-1">
                    {formatTimestamp(entry.created_at)}
                  </p>
                </div>
              </div>
            );

            return entry.link ? (
              <Link
                key={entry.id}
                href={entry.link}
                className={cn("block hover:bg-surface-hover/50 transition-colors")}
              >
                {body}
              </Link>
            ) : (
              <div key={entry.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
