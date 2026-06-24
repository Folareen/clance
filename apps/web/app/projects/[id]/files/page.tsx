"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  MessageCircle,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-provider";
import { api, ApiError, type FileRecord } from "@/lib/api";

export default function ProjectFiles() {
  const { project } = useProject();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "task" | "message">("all");

  const projectId = project?.id ?? "";

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listProjectFiles(projectId);
      setFiles(data);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filtered = files.filter((f) => {
    if (typeFilter !== "all" && f.attach_type !== typeFilter) return false;
    if (search && !f.filename.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Files</h1>
          <p className="text-content-secondary mt-1">
            Everything attached to tasks &amp; chats you can see
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface border border-stroke rounded-lg p-0.5">
          {(["all", "task", "message"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                typeFilter === t
                  ? "bg-accent text-accent-contrast"
                  : "text-content-secondary hover:text-content hover:bg-surface-hover"
              )}
            >
              {t === "all" ? "All" : t === "task" ? "Tasks" : "Chats"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileIcon className="w-12 h-12 text-content-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-content mb-1">
            {files.length === 0 ? "No files yet" : "No files match your search"}
          </h3>
          <p className="text-content-secondary text-sm">
            Files only exist as attachments on tasks or chats.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-stroke rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_140px_100px_90px] gap-4 px-5 py-3 border-b border-stroke bg-surface-secondary text-xs font-medium text-content-muted uppercase tracking-wider">
            <div>Name</div>
            <div>Source</div>
            <div>Size</div>
            <div>Added</div>
          </div>
          <div className="divide-y divide-stroke-secondary">
            {filtered.map((f) => {
              const isImage = f.mimetype?.startsWith("image/");
              const Icon = isImage ? ImageIcon : getFileIcon(f.filename);
              const iconColor = isImage
                ? "text-info bg-info-soft"
                : getFileColor(f.filename);

              return (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_100px_90px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 items-center hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        iconColor
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">
                        {f.filename}
                      </p>
                      <p className="text-xs text-content-muted sm:hidden">
                        {f.size ? formatFileSize(f.size) : ""} &middot;{" "}
                        {formatDate(f.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-content-secondary">
                    {f.attach_type === "task" ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">
                      {f.attach_type === "task" ? "Task" : "Chat"}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm text-content-secondary">
                    {f.size ? formatFileSize(f.size) : "—"}
                  </span>
                  <span className="hidden sm:block text-sm text-content-muted">
                    {formatDate(f.created_at)}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-content-muted mt-4">
        Files only exist as attachments on a task or chat — there&apos;s no
        separate upload. Visibility is inherited from the task or chat they live
        in.
      </p>
    </div>
  );
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext ?? ""))
    return FileText;
  return FileIcon;
}

function getFileColor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext ?? "")) return "text-danger bg-danger-soft";
  if (["doc", "docx", "txt", "md"].includes(ext ?? ""))
    return "text-info bg-info-soft";
  if (["xls", "xlsx", "csv"].includes(ext ?? ""))
    return "text-success bg-success-soft";
  if (["zip", "rar", "tar", "gz"].includes(ext ?? ""))
    return "text-accent bg-accent-soft";
  return "text-warning bg-warning-soft";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
