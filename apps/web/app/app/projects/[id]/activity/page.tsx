"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
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
import { PageHeader, PageBody } from "@/components/page-header";
import { Card, EmptyState, Skeleton, Alert } from "@/components/ui";
import { api, ApiError, type ActivityEntry, type ActivityType } from "@/lib/api";

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
    <>
      <PageHeader
        title="Activity"
        description="Every status change, approval, edit, and upload, timestamped"
      />

      <PageBody>
        {error && <Alert className="mb-4">{error}</Alert>}

        {loading ? (
          <Card className="divide-y divide-stroke-secondary overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 sm:px-5 py-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton
                    className="h-3.5 rounded"
                    style={{ width: `${50 + ((i * 11) % 30)}%` }}
                  />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </Card>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Activity will appear here"
            description="A running record of everything that happens in this project, visible to managers and workers alike."
          />
        ) : (
          <Card className="overflow-hidden">
            <ol className="relative">
              {entries.map((entry, i) => {
                const Icon = activityIcons[entry.type] ?? Activity;
                const last = i === entries.length - 1;

                const body = (
                  <div className="relative flex items-start gap-3 px-4 sm:px-5 py-4">
                    {/* Timeline rail */}
                    {!last && (
                      <span
                        aria-hidden
                        className="absolute left-[31px] sm:left-[35px] top-[52px] bottom-0 w-px bg-stroke-secondary"
                      />
                    )}
                    <span className="relative z-10 w-8 h-8 rounded-full bg-surface-hover border border-stroke flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-content-secondary" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-content leading-snug">
                        <span className="font-medium">{actorName(entry.actor)}</span>{" "}
                        <span className="text-content-secondary">{entry.summary}</span>
                      </p>
                      {entry.body && (
                        <p className="text-sm text-content-muted mt-1.5 italic border-l-2 border-stroke-secondary pl-2.5">
                          &ldquo;{entry.body}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-content-muted mt-1.5 tabular-nums">
                        {formatTimestamp(entry.created_at)}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li
                    key={entry.id}
                    className="border-b border-stroke-secondary last:border-0"
                  >
                    {entry.link ? (
                      <Link
                        href={entry.link}
                        className="block hover:bg-surface-hover/60 active:bg-surface-hover transition-colors"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        )}
      </PageBody>
    </>
  );
}
