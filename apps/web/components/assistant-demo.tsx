"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Lock, CornerDownLeft, Wand2, Check } from "lucide-react";

/**
 * Landing-page demo of the AI assistant.
 *
 * Types a question, "thinks", then reveals an answer, looping through a few
 * real examples. Every question and answer below reflects what the assistant
 * actually does per the spec: read-only Q&A over project data, and
 * manager-only task drafting that a human must confirm.
 */

const EXCHANGES = [
  {
    q: "What's overdue?",
    a: [
      "Two tasks are past due:",
      "• #12 Fix onboarding empty state, due yesterday, Sam",
      "• #18 Update pricing copy, due Monday, unassigned",
    ].join("\n"),
  },
  {
    q: "What's awaiting my approval?",
    a: [
      "#14 Wire up push notifications was submitted 2h ago by Ade.",
      "Its two subtasks are both approved, so it's ready for you.",
    ].join("\n"),
  },
  {
    q: "Summarize the thread on #12",
    a: [
      "Sam hit a caching bug, pushed a fix, and tagged #12.",
      "Priya approved it. Ship date was pinned as a decision: Friday.",
    ].join("\n"),
  },
];

type Phase = "typing" | "thinking" | "answering" | "holding";

/**
 * Whether we should animate at all. Resolved once, lazily, so the static
 * fallback is the component's initial state rather than an effect that
 * re-renders straight after mount.
 */
function canAnimate() {
  if (typeof window === "undefined") return false;
  if (typeof IntersectionObserver === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AssistantDemo() {
  const [animated] = useState(canAnimate);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(() => (canAnimate() ? "" : EXCHANGES[0].q));
  const [phase, setPhase] = useState<Phase>(() =>
    canAnimate() ? "typing" : "answering"
  );
  // Start paused: the observer un-pauses us once the card is on screen.
  const [paused, setPaused] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only run the loop while the card is actually visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !animated) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated]);

  useEffect(() => {
    if (paused || !animated) return;
    const current = EXCHANGES[index];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed.length < current.q.length) {
        timer = setTimeout(
          () => setTyped(current.q.slice(0, typed.length + 1)),
          38
        );
      } else {
        timer = setTimeout(() => setPhase("thinking"), 420);
      }
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("answering"), 900);
    } else if (phase === "answering") {
      timer = setTimeout(() => setPhase("holding"), 3600);
    } else {
      timer = setTimeout(() => {
        setTyped("");
        setPhase("typing");
        setIndex((i) => (i + 1) % EXCHANGES.length);
      }, 350);
    }

    return () => clearTimeout(timer);
  }, [phase, typed, index, paused, animated]);

  const current = EXCHANGES[index];
  const showAnswer = phase === "answering" || phase === "holding";

  return (
    <div
      ref={containerRef}
      className="rounded-2xl bg-surface shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 sm:px-5 h-12 border-b border-stroke">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-semibold text-content">AI Assistant</span>
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-active text-[11px] font-semibold text-content-secondary">
          <Lock className="w-3 h-3" />
          Read-only
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Question input */}
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-accent/40 bg-surface ring-[3px] ring-accent/10">
          <span className="text-sm text-content truncate">
            {typed}
            {phase === "typing" && (
              <span className="animate-caret text-accent font-medium">|</span>
            )}
          </span>
          <CornerDownLeft className="ml-auto w-3.5 h-3.5 text-content-muted shrink-0" />
        </div>

        {/* Answer */}
        <div className="mt-3 min-h-[104px]">
          {phase === "thinking" && (
            <div className="flex items-center gap-2 px-1 pt-2 text-sm text-content-muted">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-content-muted animate-float-slow"
                    style={{ animationDelay: `${i * 160}ms`, animationDuration: "1.1s" }}
                  />
                ))}
              </span>
              Reading your project…
            </div>
          )}

          {showAnswer && (
            <div
              key={index}
              className="rounded-lg bg-surface-secondary border border-stroke-secondary p-3.5 animate-fade-up"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                  Answer
                </span>
              </div>
              <p className="text-[13px] text-content leading-relaxed whitespace-pre-line">
                {current.a}
              </p>
            </div>
          )}
        </div>

        {/* Drafting note, the guardrail, stated plainly */}
        <div className="mt-4 pt-4 border-t border-stroke-secondary flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-content">
              Managers can also ask it to draft a task
            </p>
            <p className="text-xs text-content-secondary mt-0.5 leading-relaxed flex items-start gap-1">
              <Check className="w-3 h-3 text-success mt-0.5 shrink-0" />
              It fills in title, assignee, priority and parent. You confirm
              before anything is created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
