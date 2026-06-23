import { Sparkles, ArrowUp } from "lucide-react";

export default function ProjectAssistant() {
  const suggestions = [
    "What's overdue right now?",
    "What's assigned to me?",
    "Summarize the latest chat thread",
    "Which tasks are awaiting approval?",
  ];

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 sm:px-8 py-6 border-b border-stroke-secondary">
        <h1 className="text-2xl font-semibold text-content flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Assistant
        </h1>
        <p className="text-content-secondary mt-1">
          Ask about this project — read-only answers over your data
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-base font-semibold text-content">
          How can I help?
        </h2>
        <p className="text-sm text-content-secondary mt-1.5 mb-6 text-center max-w-sm">
          I can answer questions about tasks, chats, and files you have access
          to in this project.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              className="text-left text-sm text-content-secondary border border-stroke rounded-lg px-4 py-3 hover:border-accent/40 hover:text-content transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-stroke">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          <input
            type="text"
            placeholder="Ask anything about this project…"
            className="flex-1 px-4 py-3 rounded-xl border border-stroke bg-surface-secondary text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          <button className="p-3 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl transition-colors">
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
