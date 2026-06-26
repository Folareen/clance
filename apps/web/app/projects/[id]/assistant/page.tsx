"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useProject } from "@/components/project-provider";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's overdue right now?",
  "What tasks are assigned to me?",
  "Summarize recent chat activity",
  "Which tasks are awaiting approval?",
  "Give me a project status update",
  "Who's working on what?",
];

function AssistantMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="text-sm text-content-secondary leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1.5" />;

        if (line.startsWith("### "))
          return <p key={i} className="text-sm font-semibold text-content mt-2">{inlineFormat(line.slice(4))}</p>;
        if (line.startsWith("## "))
          return <p key={i} className="text-sm font-bold text-content mt-2">{inlineFormat(line.slice(3))}</p>;

        if (/^[-*]\s/.test(line))
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-content-muted shrink-0">•</span>
              <span>{inlineFormat(line.slice(2))}</span>
            </div>
          );

        const numMatch = line.match(/^(\d+)\.\s(.*)$/);
        if (numMatch)
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-content-muted shrink-0 tabular-nums">{numMatch[1]}.</span>
              <span>{inlineFormat(numMatch[2])}</span>
            </div>
          );

        return <p key={i}>{inlineFormat(line)}</p>;
      })}
    </div>
  );
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`|#(\d+))/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} className="font-semibold text-content">{m[2]}</strong>);
    else if (m[3]) parts.push(<code key={m.index} className="text-xs bg-surface-hover px-1 py-0.5 rounded font-mono">{m[3]}</code>);
    else if (m[4]) parts.push(<span key={m.index} className="font-medium text-accent">#{m[4]}</span>);
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function ProjectAssistant() {
  const { project } = useProject();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || !project || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
    ]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await api.askAssistant(project.id, text.trim(), history);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to get a response");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 sm:px-8 py-6 border-b border-stroke-secondary shrink-0">
        <h1 className="text-2xl font-semibold text-content flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Assistant
        </h1>
        <p className="text-content-secondary mt-1">
          Ask about this project — read-only answers over your data
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-base font-semibold text-content">How can I help?</h2>
            <p className="text-sm text-content-secondary mt-1.5 mb-6 text-center max-w-sm">
              I can answer questions about tasks, chats, and files you have access to in this project.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm text-content-secondary border border-stroke rounded-lg px-4 py-3 hover:border-accent/40 hover:text-content transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "assistant"
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-hover text-content-muted",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-semibold">Y</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className="text-xs font-medium text-content mb-1 block">
                    {msg.role === "assistant" ? "Assistant" : "You"}
                  </span>
                  {msg.role === "assistant" ? (
                    <AssistantMessage content={msg.content} />
                  ) : (
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="pt-2">
                  <Loader2 className="w-4 h-4 text-content-muted animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-stroke shrink-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this project…"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-accent hover:bg-accent-hover text-accent-contrast rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
