import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single header treatment for every inner page.
 *
 * On mobile it sticks to the top of the scroll container so the page
 * title and its primary action stay reachable; on desktop it sits
 * inline. `toolbar` renders below the title row for filters/search.
 */
export function PageHeader({
  title,
  description,
  actions,
  toolbar,
  eyebrow,
  sticky = true,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  eyebrow?: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface-secondary/85 backdrop-blur-md",
        "border-b border-stroke",
        sticky && "sticky top-0 z-20",
        className
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center gap-3 py-4 sm:py-5">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
                {eyebrow}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-semibold text-content tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-content-secondary mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
        {toolbar && <div className="pb-3 sm:pb-4">{toolbar}</div>}
      </div>
    </div>
  );
}

/** Standard content well, matching PageHeader's gutters. */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Small uppercase section label used between blocks on a page. */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-3", className)}>
      <h2 className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
        {children}
      </h2>
      {action}
    </div>
  );
}
