"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Centered dialog on desktop, bottom sheet on mobile.
 *
 * Closes on backdrop click and Escape, and locks the page scroll while
 * open so iOS doesn't scroll the content behind the sheet.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [onClose]);

  const maxW = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-surface shadow-xl flex flex-col",
          "max-h-[92vh] sm:max-h-[85vh]",
          "rounded-t-2xl sm:rounded-2xl sm:border border-stroke",
          "animate-sheet-in sm:animate-scale-in",
          maxW,
          className
        )}
      >
        {/* Grab handle, mobile only */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-9 h-1 rounded-full bg-stroke" />
        </div>

        <div className="flex items-start gap-3 px-5 pt-4 sm:pt-5 pb-3 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-content">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-content-secondary mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 -mr-1 -mt-0.5 shrink-0 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto overscroll-none-touch scroll-thin flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-stroke bg-surface-secondary/50 shrink-0 rounded-b-none sm:rounded-b-2xl pb-safe sm:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
