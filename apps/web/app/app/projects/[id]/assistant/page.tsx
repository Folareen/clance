"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Send, Wand2, Lock, Loader2, CornerDownLeft } from "lucide-react";
import { useProject } from "@/components/project-provider";
import { toast } from "@/components/toast";
import { api, ApiError, type Task, type AiDraftTask } from "@/lib/api";
import {
  CreateTaskModal,
  type CreateTaskModalInitial,
} from "@/components/create-task-modal";
import { PageHeader, PageBody } from "@/components/page-header";
import { Button, Card, Badge, Input, Textarea, Label } from "@/components/ui";

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

  const SUGGESTIONS = [
    "What's overdue?",
    "What's assigned to me?",
    "What hasn't been submitted yet?",
    "What's awaiting approval?",
  ];

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

  const askQuestion = (q: string) => {
    setQuestion(q);
    // Ask immediately when a suggestion is used
    if (!projectId) return;
    setAsking(true);
    api
      .askAssistant(projectId, q)
      .then((res) => setAnswer(res.answer))
      .catch((err) =>
        toast(err instanceof ApiError ? err.message : "Failed to get an answer")
      )
      .finally(() => setAsking(false));
  };

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            AI Assistant
          </span>
        }
        description="Ask about this project. Answers come from your own tasks and chat"
      />

      <PageBody className="max-w-3xl space-y-6">
        {/* Q&A */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Label className="mb-0">Ask a question</Label>
            <Badge tone="neutral" icon={Lock}>
              Read-only
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="What's overdue? Summarize task #12…"
                className="pr-9"
              />
              <CornerDownLeft className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
            </div>
            <Button
              icon={Send}
              onClick={handleAsk}
              disabled={!question.trim()}
              loading={asking}
              className="sm:w-auto w-full"
            >
              Ask
            </Button>
          </div>

          {/* Suggestions */}
          {!answer && !asking && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => askQuestion(sug)}
                  className="px-2.5 h-7 rounded-full border border-stroke bg-surface-secondary text-xs font-medium text-content-secondary hover:border-accent/40 hover:text-accent transition-colors press"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {asking && (
            <div className="flex items-center gap-2 mt-4 text-sm text-content-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Reading your project…
            </div>
          )}

          {!asking && answer && (
            <div className="mt-4 rounded-lg bg-surface-secondary border border-stroke-secondary p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
                  Answer
                </span>
              </div>
              <p className="text-sm text-content leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
              <button
                onClick={() => {
                  setAnswer(null);
                  setQuestion("");
                }}
                className="mt-3 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Ask something else
              </button>
            </div>
          )}
        </Card>

        {/* Task drafting, managers only */}
        {isManager && (
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <Label className="mb-0 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-accent" />
                Draft a task
              </Label>
              <Badge tone="accent">Manager</Badge>
            </div>
            <p className="text-sm text-content-secondary mb-3 leading-relaxed">
              Describe what needs to get done. You&apos;ll review and edit the
              draft before anything is created.
            </p>
            <Textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
              placeholder="e.g. We need someone to fix the broken checkout flow on mobile, it's urgent"
              className="mb-3"
            />
            <Button
              icon={Wand2}
              onClick={handleDraft}
              disabled={!taskDescription.trim()}
              loading={drafting}
            >
              {drafting ? "Drafting…" : "Draft task"}
            </Button>
          </Card>
        )}
      </PageBody>

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
    </>
  );
}
