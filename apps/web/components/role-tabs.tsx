"use client";

import { useState } from "react";
import { CheckCircle2, LayoutDashboard, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleView = { label: string; blurb: string; items: string[] };

/**
 * Worker/manager dashboard comparison. Same project, different glance,
 * so it reads best as one panel you switch, not two you scan.
 */
export function RoleTabs({
  worker,
  manager,
}: {
  worker: RoleView;
  manager: RoleView;
}) {
  const [role, setRole] = useState<"worker" | "manager">("worker");
  const active = role === "worker" ? worker : manager;

  return (
    <div>
      <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl border border-stroke bg-surface-secondary mb-6">
        {(["worker", "manager"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            aria-pressed={role === key}
            className={cn(
              "inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all duration-200",
              role === key
                ? "bg-surface text-content shadow-xs"
                : "text-content-secondary hover:text-content"
            )}
          >
            {key === "worker" ? (
              <LayoutDashboard className="w-4 h-4" />
            ) : (
              <UserCog className="w-4 h-4" />
            )}
            {key === "worker" ? worker.label : manager.label}
          </button>
        ))}
      </div>

      <div
        key={role}
        className="rounded-2xl bg-surface shadow-sm p-6 animate-fade-up"
      >
        <p className="text-content-secondary leading-relaxed mb-5">
          {active.blurb}
        </p>
        <ul className="space-y-3.5">
          {active.items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span className="text-sm text-content leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
