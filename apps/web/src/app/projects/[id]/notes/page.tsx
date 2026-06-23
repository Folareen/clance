"use client";

import { Plus, Pin, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const notes = [
  { id: 1, title: "Kickoff decisions", excerpt: "We agreed to ship the redesign in two phases. Phase 1 covers auth + onboarding, phase 2 covers the dashboard…", author: "SA", time: "Jun 20", pinned: true },
  { id: 2, title: "Design tokens reference", excerpt: "Accent: violet 600. Surfaces follow a 3-step elevation scale. Status colors map to semantic meaning only…", author: "EW", time: "Jun 21", pinned: true },
  { id: 3, title: "Open questions for client", excerpt: "1. Do we need SSO at launch? 2. What's the data retention policy? 3. Confirm supported locales…", author: "SA", time: "Jun 22", pinned: false },
  { id: 4, title: "API rate limits", excerpt: "Payment provider caps at 100 req/min. We should batch webhook processing and add a retry queue…", author: "MJ", time: "Jun 22", pinned: false },
  { id: 5, title: "Meeting notes — weekly sync", excerpt: "Attendees: Saka, Sarah, Mike. Blockers: waiting on design handoff for the settings screen…", author: "SC", time: "Jun 23", pinned: false },
];

export default function ProjectNotes() {
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Notes</h1>
          <p className="text-content-secondary mt-1">Project scratchpad &amp; decisions</p>
        </div>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {pinned.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" /> Pinned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {pinned.map((n) => <NoteCard key={n.id} note={n} />)}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">All notes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rest.map((n) => <NoteCard key={n.id} note={n} />)}
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: { title: string; excerpt: string; author: string; time: string; pinned: boolean } }) {
  return (
    <div className="group bg-surface border border-stroke rounded-xl p-5 hover:border-accent/40 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-content-muted shrink-0" />
          <h3 className="font-medium text-content truncate group-hover:text-accent transition-colors">{note.title}</h3>
        </div>
        {note.pinned && <Pin className={cn("w-3.5 h-3.5 text-accent shrink-0")} />}
      </div>
      <p className="text-sm text-content-muted line-clamp-3 leading-relaxed">{note.excerpt}</p>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stroke-secondary">
        <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center text-[9px] font-semibold text-accent">{note.author}</div>
        <span className="text-xs text-content-muted">{note.time}</span>
      </div>
    </div>
  );
}
