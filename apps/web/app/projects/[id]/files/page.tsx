"use client";

import {
  Search,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileSpreadsheet,
  File as FileIcon,
  MessageCircle,
  CheckSquare,
} from "lucide-react";

const files = [
  { name: "onboarding-wireframes.fig", size: "4.2 MB", icon: ImageIcon, color: "text-info bg-info-soft", source: "task", sourceLabel: "CLN-42", time: "2h ago" },
  { name: "brand-guidelines-v2.pdf", size: "1.8 MB", icon: FileText, color: "text-danger bg-danger-soft", source: "chat", sourceLabel: "#design", time: "5h ago" },
  { name: "api-spec.json", size: "112 KB", icon: FileIcon, color: "text-warning bg-warning-soft", source: "task", sourceLabel: "CLN-38", time: "Yesterday" },
  { name: "budget-q3.xlsx", size: "320 KB", icon: FileSpreadsheet, color: "text-success bg-success-soft", source: "chat", sourceLabel: "#general", time: "Yesterday" },
  { name: "logo-concepts.zip", size: "12.4 MB", icon: FileArchive, color: "text-accent bg-accent-soft", source: "task", sourceLabel: "CLN-40", time: "Jun 21" },
  { name: "hero-mockup.png", size: "2.1 MB", icon: ImageIcon, color: "text-info bg-info-soft", source: "chat", sourceLabel: "DM · Sarah", time: "Jun 20" },
];

export default function ProjectFiles() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Files</h1>
          <p className="text-content-secondary mt-1">
            Everything attached to tasks &amp; chats you can see
          </p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            placeholder="Search files..."
            className="pl-9 pr-4 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="bg-surface border border-stroke rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_140px_100px_90px] gap-4 px-5 py-3 border-b border-stroke bg-surface-secondary text-xs font-medium text-content-muted uppercase tracking-wider">
          <div>Name</div>
          <div>Source</div>
          <div>Size</div>
          <div>Added</div>
        </div>
        <div className="divide-y divide-stroke-secondary">
          {files.map((f) => (
            <div
              key={f.name}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_100px_90px] gap-3 sm:gap-4 px-4 sm:px-5 py-3 items-center hover:bg-surface-hover/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.color}`}>
                  <f.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content truncate group-hover:text-accent transition-colors">{f.name}</p>
                  <p className="text-xs text-content-muted sm:hidden">{f.size} · {f.time}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-content-secondary">
                {f.source === "task" ? <CheckSquare className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                <span className="truncate">{f.sourceLabel}</span>
              </div>
              <span className="hidden sm:block text-sm text-content-secondary">{f.size}</span>
              <span className="hidden sm:block text-sm text-content-muted">{f.time}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-content-muted mt-4">
        Files only exist as attachments on a task or chat — there&apos;s no separate upload. Visibility is inherited from the task or chat they live in.
      </p>
    </div>
  );
}
