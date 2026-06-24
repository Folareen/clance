import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-stroke rounded-xl bg-surface">
      <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-content-muted" />
      </div>
      <h2 className="text-base font-semibold text-content">{title}</h2>
      <p className="text-sm text-content-secondary mt-1.5 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
