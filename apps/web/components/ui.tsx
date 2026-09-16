import type { ComponentProps, ElementType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover shadow-xs disabled:hover:bg-accent",
  secondary:
    "border border-stroke bg-surface text-content hover:bg-surface-hover hover:border-stroke disabled:hover:bg-surface",
  ghost:
    "text-content-secondary hover:bg-surface-hover hover:text-content disabled:hover:bg-transparent",
  danger:
    "bg-danger text-white hover:opacity-90 shadow-xs",
  subtle:
    "bg-accent-soft text-accent hover:bg-accent-soft-hover",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap press",
        "transition-[background-color,border-color,color,opacity,box-shadow] duration-150",
        "disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && <Icon className={cn("shrink-0", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  interactive,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "bg-surface border border-stroke rounded-xl shadow-xs",
        interactive && "hover-lift hover:border-accent/40 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Badge: status pills, roles, counts
 * ------------------------------------------------------------------ */

type BadgeTone =
  | "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "outline";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-active text-content-secondary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  outline: "border border-stroke text-content-secondary",
};

export function Badge({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap",
        BADGE_TONES[tone],
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Inputs: 16px on mobile is enforced globally in globals.css
 * ------------------------------------------------------------------ */

const FIELD_BASE =
  "w-full rounded-lg border border-stroke bg-surface text-content text-sm " +
  "placeholder:text-content-muted transition-[border-color,box-shadow] duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_BASE, "h-10 px-3.5", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD_BASE, "px-3.5 py-2.5 resize-none", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        FIELD_BASE,
        "h-10 pl-3.5 pr-9 cursor-pointer",
        "bg-[image:var(--select-caret)] bg-[position:right_0.75rem_center] bg-no-repeat bg-[size:1rem]",
        className
      )}
      style={{
        // Inline so the caret picks up currentColor in both themes
        ["--select-caret" as string]:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("block text-sm font-medium text-content mb-1.5", className)} {...props}>
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-content-muted mt-1.5">{children}</p>;
}

/* ------------------------------------------------------------------ *
 * Segmented control: view switchers & filters
 * ------------------------------------------------------------------ */

export function Segmented({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-stroke bg-surface-secondary",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SegmentedItem({
  active,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-3 h-7 rounded-md",
        "text-[13px] font-medium whitespace-nowrap transition-all duration-150",
        active
          ? "bg-surface text-content shadow-xs"
          : "text-content-secondary hover:text-content",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Skeletons
 * ------------------------------------------------------------------ */

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("bg-surface border border-stroke rounded-xl overflow-hidden", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-secondary last:border-0"
        >
          <Skeleton className="w-4 h-4 rounded-full shrink-0" />
          <Skeleton className="h-3.5 rounded" style={{ width: `${45 + ((i * 13) % 35)}%` }} />
          <Skeleton className="w-14 h-3.5 rounded ml-auto shrink-0 hidden sm:block" />
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-stroke rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded mb-2" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Stat tile
 * ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  hint?: string;
}) {
  const toneText = {
    neutral: "text-content",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  }[tone];

  return (
    <div className="px-4 sm:px-5 py-4 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0", toneText)} />}
        <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums leading-none", toneText)}>{value}</p>
      {hint && <p className="text-xs text-content-muted mt-1.5 truncate">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Empty state
 * ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 sm:py-20 px-6 rounded-xl border border-dashed border-stroke bg-surface",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-content-muted" />
      </div>
      <h3 className="text-base font-semibold text-content">{title}</h3>
      <p className="text-sm text-content-secondary mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Inline alert
 * ------------------------------------------------------------------ */

export function Alert({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "warning" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    danger: "bg-danger-soft text-danger border-danger/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    success: "bg-success-soft text-success border-success/20",
    info: "bg-info-soft text-info border-info/20",
  };
  return (
    <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Avatar
 * ------------------------------------------------------------------ */

export function Avatar({
  name,
  size = 28,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const label = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <span
      title={name || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0",
        "bg-accent-soft text-accent font-semibold select-none",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Progress bar
 * ------------------------------------------------------------------ */

export function Progress({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "success";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full rounded-full bg-surface-active overflow-hidden", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "accent" ? "bg-accent" : "bg-success"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tooltip: CSS-only, no positioning library
 * ------------------------------------------------------------------ */

export function Tooltip({
  label,
  children,
  as: Tag = "span",
}: {
  label: string;
  children: ReactNode;
  as?: ElementType;
}) {
  return (
    <Tag className="relative inline-flex group/tt">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50",
          "whitespace-nowrap rounded-md bg-nav-bg px-2 py-1 text-[11px] font-medium text-white",
          "opacity-0 translate-y-1 transition-all duration-150",
          "group-hover/tt:opacity-100 group-hover/tt:translate-y-0",
          "hidden sm:block"
        )}
      >
        {label}
      </span>
    </Tag>
  );
}
