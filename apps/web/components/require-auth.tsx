"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-secondary">
        <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
