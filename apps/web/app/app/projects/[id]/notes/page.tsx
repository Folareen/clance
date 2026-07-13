"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pin, FileText, X, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-provider";
import { api, ApiError, type Note } from "@/lib/api";
import { TiptapEditor, TiptapViewer } from "@/components/tiptap-editor";
import { ConfirmModal } from "@/components/confirm-modal";
import { PagePlaceholder } from "@/components/page-placeholder";
import { toast } from "@/components/toast";

export default function ProjectNotes() {
  const { project } = useProject();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectId = project?.id ?? "";

  const loadNotes = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listNotes(projectId);
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const openNote = async (noteId: string) => {
    try {
      const note = await api.getNote(projectId, noteId);
      setSelected(note);
    } catch {}
  };

  if (selected) {
    return (
      <NoteEditor
        note={selected}
        projectId={projectId}
        onBack={() => {
          setSelected(null);
          loadNotes();
        }}
        onDeleted={() => {
          setSelected(null);
          loadNotes();
        }}
      />
    );
  }

  if (showCreate) {
    return (
      <NoteEditor
        projectId={projectId}
        onBack={() => {
          setShowCreate(false);
          loadNotes();
        }}
        onDeleted={() => {
          setShowCreate(false);
          loadNotes();
        }}
      />
    );
  }

  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Notes</h1>
          <p className="text-content-secondary mt-1">
            Project scratchpad &amp; decisions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-content-muted">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <PagePlaceholder
          icon={FileText}
          title="No notes yet"
          description="Create a note to start documenting decisions and ideas."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          }
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5" /> Pinned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {pinned.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onClick={() => openNote(n.id)}
                  />
                ))}
              </div>
            </>
          )}

          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
            All notes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onClick={() => openNote(n.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NoteCard({ note, onClick }: { note: Note; onClick: () => void }) {
  const authorName = note.author.first_name
    ? `${note.author.first_name} ${note.author.last_name ?? ""}`.trim()
    : note.author.email ?? "";

  const authorInitials = note.author.first_name
    ? (
        note.author.first_name.charAt(0) +
        (note.author.last_name?.charAt(0) ?? "")
      ).toUpperCase()
    : (note.author.email ?? "?").charAt(0).toUpperCase();

  const excerpt = extractPlainText(note.content);

  return (
    <div
      onClick={onClick}
      className="group bg-surface border border-stroke rounded-xl p-5 hover:border-accent/40 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-content-muted shrink-0" />
          <h3 className="font-medium text-content truncate group-hover:text-accent transition-colors">
            {note.title}
          </h3>
        </div>
        {note.pinned && (
          <Pin className={cn("w-3.5 h-3.5 text-accent shrink-0")} />
        )}
      </div>
      <p className="text-sm text-content-muted line-clamp-3 leading-relaxed">
        {excerpt || "Empty note"}
      </p>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stroke-secondary">
        <div
          className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center text-[9px] font-semibold text-accent"
          title={authorName}
        >
          {authorInitials}
        </div>
        <span className="text-xs text-content-muted">
          {new Date(note.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

function NoteEditor({
  note,
  projectId,
  onBack,
  onDeleted,
}: {
  note?: Note;
  projectId: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState<any>(note?.content ?? null);
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!note);
  const [noteId, setNoteId] = useState(note?.id ?? "");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (noteId) {
        await api.updateNote(projectId, noteId, { title, content, pinned });
      } else {
        const created = await api.createNote(projectId, {
          title,
          content,
          pinned,
        });
        setNoteId(created.id);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) {
      onBack();
      return;
    }
    setDeleting(true);
    try {
      await api.deleteNote(projectId, noteId);
      onDeleted();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete note");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const togglePin = async () => {
    const prev = pinned;
    const next = !prev;
    setPinned(next);
    if (noteId) {
      try {
        await api.updateNote(projectId, noteId, { pinned: next });
      } catch (err) {
        setPinned(prev);
        toast(err instanceof ApiError ? err.message : "Failed to update pin");
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-content transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePin}
            className={cn(
              "p-2 rounded-lg transition-colors",
              pinned
                ? "text-accent bg-accent-soft"
                : "text-content-muted hover:text-content hover:bg-surface-hover"
            )}
            title={pinned ? "Unpin" : "Pin"}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => noteId ? setShowDeleteConfirm(true) : onBack()}
            className="p-2 rounded-lg text-content-muted hover:text-danger hover:bg-danger-soft transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Save" : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-soft text-danger text-sm">
          {error}
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="w-full text-2xl font-semibold text-content bg-transparent border-none focus:outline-none placeholder:text-content-muted mb-4"
        autoFocus={!note}
      />

      <TiptapEditor
        content={content}
        onChange={setContent}
        placeholder="Start writing..."
      />

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete note"
          message={`Delete "${title || "Untitled"}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function extractPlainText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (content.type === "doc" && Array.isArray(content.content)) {
    return content.content
      .map((node: any) => {
        if (node.type === "paragraph" && Array.isArray(node.content)) {
          return node.content
            .map((c: any) => c.text ?? "")
            .join("");
        }
        if (node.type === "heading" && Array.isArray(node.content)) {
          return node.content
            .map((c: any) => c.text ?? "")
            .join("");
        }
        return "";
      })
      .filter(Boolean)
      .join(" ")
      .slice(0, 200);
  }
  return "";
}
