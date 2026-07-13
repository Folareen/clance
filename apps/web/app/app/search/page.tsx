"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileIcon,
  Image,
  MessageCircle,
  Users,
  Hash,
  Loader2,
  X,
  CheckSquare,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RequireAuth } from "@/components/require-auth";
import { api, type SearchResults, type TaskStatus } from "@/lib/api";
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SearchContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      api.search(query.trim()).then((data) => {
        setResults(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.notes.length > 0 ||
      results.messages.length > 0 ||
      results.files.length > 0 ||
      results.members.length > 0);

  const noResults = results && !hasResults && query.trim().length >= 2;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-content mb-4">Search</h1>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search tasks, notes, chats, files, and people…"
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-hover text-content-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
          </div>
        )}

        {!loading && noResults && (
          <div className="text-center py-12">
            <p className="text-sm text-content-muted">
              No results for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {!loading && !hasResults && !noResults && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-content-muted/40 mx-auto mb-3" />
            <p className="text-sm text-content-muted">
              Results are scoped to the projects you&apos;re a member of.
            </p>
          </div>
        )}

        {!loading && hasResults && (
          <div className="space-y-6">
            {/* Tasks */}
            {results!.tasks.length > 0 && (
              <ResultSection title="Tasks" count={results!.tasks.length}>
                {results!.tasks.map((task) => {
                  const cfg = statusConfig[task.status] ?? UNKNOWN_STATUS;
                  const Icon = cfg.icon;
                  return (
                    <Link
                      key={task.id}
                      href={`/app/projects/${task.project_id}/tasks`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors group"
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", cfg.className)} />
                      <span className="text-xs text-content-muted font-mono shrink-0">
                        #{task.task_number}
                      </span>
                      <span className="text-sm font-medium text-content truncate flex-1 group-hover:text-accent transition-colors">
                        {task.title}
                      </span>
                      <span className="text-xs text-content-muted truncate hidden sm:block">
                        {task.project_name}
                      </span>
                    </Link>
                  );
                })}
              </ResultSection>
            )}

            {/* Notes */}
            {results!.notes.length > 0 && (
              <ResultSection title="Notes" count={results!.notes.length}>
                {results!.notes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/app/projects/${note.project_id}/notes`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-content-muted shrink-0" />
                    <span className="text-sm font-medium text-content truncate flex-1 group-hover:text-accent transition-colors">
                      {note.title}
                    </span>
                    {note.pinned && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-accent-soft text-accent">
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-content-muted truncate hidden sm:block">
                      {note.project_name}
                    </span>
                  </Link>
                ))}
              </ResultSection>
            )}

            {/* Messages */}
            {results!.messages.length > 0 && (
              <ResultSection title="Messages" count={results!.messages.length}>
                {results!.messages.map((msg) => {
                  const sender = msg.sender_first_name
                    ? `${msg.sender_first_name} ${msg.sender_last_name ?? ""}`.trim()
                    : msg.sender_email;
                  const isTaskComment = msg.channel_type === "task_comment";
                  const href = isTaskComment
                    ? `/app/projects/${msg.project_id}/tasks`
                    : `/app/projects/${msg.project_id}/chat`;
                  const context = isTaskComment
                    ? `on #${msg.task_number} ${msg.task_title}`
                    : `in #${msg.channel_name ?? "dm"}`;

                  return (
                    <Link
                      key={msg.id}
                      href={href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors group"
                    >
                      {isTaskComment ? (
                        <CheckSquare className="w-4 h-4 text-content-muted shrink-0 mt-0.5" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-content-muted shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-content">{sender}</span>
                          <span className="text-[11px] text-content-muted truncate">
                            {context}
                          </span>
                        </div>
                        <p className="text-sm text-content-secondary truncate">
                          {msg.content}
                        </p>
                      </div>
                      <span className="text-xs text-content-muted shrink-0 hidden sm:block">
                        {msg.project_name}
                      </span>
                    </Link>
                  );
                })}
              </ResultSection>
            )}

            {/* Files */}
            {results!.files.length > 0 && (
              <ResultSection title="Files" count={results!.files.length}>
                {results!.files.map((file) => {
                  const isImage = file.mimetype?.startsWith("image/");
                  return (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors group"
                    >
                      {isImage ? (
                        <Image className="w-4 h-4 text-info shrink-0" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-content-muted shrink-0" />
                      )}
                      <span className="text-sm font-medium text-content truncate flex-1 group-hover:text-accent transition-colors">
                        {file.filename}
                      </span>
                      {file.size && (
                        <span className="text-xs text-content-muted shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                      <span className="text-xs text-content-muted truncate hidden sm:block">
                        {file.project_name}
                      </span>
                    </a>
                  );
                })}
              </ResultSection>
            )}

            {/* Members */}
            {results!.members.length > 0 && (
              <ResultSection title="People" count={results!.members.length}>
                {results!.members.map((member) => {
                  const name = member.first_name
                    ? `${member.first_name} ${member.last_name ?? ""}`.trim()
                    : null;
                  return (
                    <Link
                      key={`${member.id}-${member.project_id}`}
                      href={`/app/projects/${member.project_id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center text-[10px] font-semibold text-accent shrink-0">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
                          {name ?? member.email}
                        </p>
                        {name && (
                          <p className="text-xs text-content-muted truncate">{member.email}</p>
                        )}
                      </div>
                      <span className="text-xs text-content-muted capitalize shrink-0">{member.role}</span>
                      <span className="text-xs text-content-muted truncate hidden sm:block">
                        {member.project_name}
                      </span>
                    </Link>
                  );
                })}
              </ResultSection>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
        {title} <span className="text-content-muted/60">({count})</span>
      </h2>
      <div className="bg-surface border border-stroke rounded-xl overflow-hidden divide-y divide-stroke-secondary">
        {children}
      </div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <RequireAuth>
      <SearchContent />
    </RequireAuth>
  );
}
