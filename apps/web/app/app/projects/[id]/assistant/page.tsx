"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Send, Wand2 } from "lucide-react";
import { useProject } from "@/components/project-provider";
import { toast } from "@/components/toast";
import { api, ApiError, type Task, type AiDraftTask } from "@/lib/api";
import {
  CreateTaskModal,
  type CreateTaskModalInitial,
} from "@/components/create-task-modal";

export default function ProjectAssistant() {
  const { project } = useProject();
  const projectId = project?.id ?? "";
  const isManager = project?.role === "manager";

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const [taskDescription, setTaskDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftInitial, setDraftInitial] = useState<CreateTaskModalInitial | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const activeMembers = project?.members.filter((m) => m.status === "active") ?? [];

  const loadTasks = useCallback(async () => {
    if (!projectId || !isManager) return;
    try {
      const data = await api.listTasks(projectId);
      setTasks(data);
    } catch {}
  }, [projectId, isManager]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAsk = async () => {
    if (!question.trim() || !projectId) return;
    setAsking(true);
    try {
      const res = await api.askAssistant(projectId, question.trim());
      setAnswer(res.answer);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to get an answer");
    } finally {
      setAsking(false);
    }
  };

  const handleDraft = async () => {
    if (!taskDescription.trim() || !projectId) return;
    setDrafting(true);
    try {
      const draft: AiDraftTask = await api.draftTask(projectId, taskDescription.trim());
      setDraftInitial({
        title: draft.title,
        description: draft.description ?? undefined,
        priority: draft.priority,
        parent_id: draft.parent_id ?? undefined,
        assignee_ids: draft.suggested_assignee_member_id
          ? [draft.suggested_assignee_member_id]
          : undefined,
      });
      setShowCreate(true);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to draft task");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-content flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-accent" />
        AI Assistant
      </h1>
      <p className="text-content-secondary mb-8">
        Ask about this project — read-only answers over your tasks
      </p>

      <div className="bg-surface border border-stroke rounded-xl p-5 mb-8">
        <label className="block text-sm font-medium text-content mb-2">
          Ask a question
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="What's overdue? What's blocked? Summarize task #12..."
            className="flex-1 px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          <button
            onClick={handleAsk}
            disabled={!question.trim() || asking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Ask
          </button>
        </div>

        {asking && (
          <div className="text-content-muted text-sm mt-4">Thinking...</div>
        )}

        {!asking && answer && (
          <div className="mt-4 p-4 rounded-lg bg-surface-secondary text-sm text-content leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>

      {isManager && (
        <div className="bg-surface border border-stroke rounded-xl p-5">
          <label className="text-sm font-medium text-content mb-1 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-accent" />
            Draft a task
          </label>
          <p className="text-content-secondary text-sm mb-3">
            Describe what needs to get done — you&apos;ll review and edit the draft before it&apos;s created.
          </p>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={3}
            placeholder="e.g. We need someone to fix the broken checkout flow on mobile, it's urgent"
            className="w-full px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none mb-3"
          />
          <button
            onClick={handleDraft}
            disabled={!taskDescription.trim() || drafting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            {drafting ? "Drafting..." : "Draft task"}
          </button>
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          members={activeMembers}
          tasks={tasks}
          initial={draftInitial ?? undefined}
          onClose={() => {
            setShowCreate(false);
            setDraftInitial(null);
          }}
          onCreated={() => {
            setShowCreate(false);
            setDraftInitial(null);
            setTaskDescription("");
            loadTasks();
            toast("Task created", "success");
          }}
        />
      )}
    </div>
  );
}
