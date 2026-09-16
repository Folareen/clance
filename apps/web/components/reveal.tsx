"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealKind = "up" | "scale" | "left" | "right";

/**
 * Reveals children once they scroll into view.
 *
 * The hidden state lives in CSS on [data-reveal]; this only adds
 * [data-visible] at the right moment. If IntersectionObserver is
 * unavailable the element is shown immediately, so content is never
 * stranded invisible.
 */
export function Reveal({
  children,
  as: Tag = "div",
  kind = "up",
  delay = 0,
  className,
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  kind?: RevealKind;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-visible", "");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.removeAttribute("data-visible");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      data-reveal={kind === "up" ? "" : kind}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Reveals each child in sequence. */
export function RevealGroup({
  children,
  className,
  step = 80,
  kind = "up",
  as: Tag = "div",
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  kind?: RevealKind;
  as?: ElementType;
}) {
  return (
    <Tag className={className}>
      {children.map((child, i) => (
        <Reveal key={i} kind={kind} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
