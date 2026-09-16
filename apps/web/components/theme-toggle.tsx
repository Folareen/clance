"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

type Variant = "inline" | "project" | "nav" | "sheet";

export function ThemeToggle({ variant = "inline" }: { variant?: Variant }) {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Light mode" : "Dark mode";

  // Dark sidebar footer
  if (variant === "nav") {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-3 w-full px-3 h-9 rounded-lg text-sm font-medium text-nav-content hover:bg-nav-hover hover:text-nav-content-active transition-colors"
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  }

  // Mobile bottom sheet, larger tap target
  if (variant === "sheet") {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-3.5 w-full px-3 h-12 rounded-xl text-[15px] font-medium text-content active:bg-surface-hover transition-colors"
      >
        <Icon className="w-5 h-5 shrink-0" />
        {label}
      </button>
    );
  }

  // Light sidebar / mobile marketing menu
  if (variant === "project") {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover hover:text-content transition-colors"
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg press",
        "border border-stroke bg-surface text-content-secondary",
        "hover:bg-surface-hover hover:text-content transition-colors"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
