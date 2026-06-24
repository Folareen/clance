"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({
  variant = "inline",
}: {
  variant?: "inline" | "project";
}) {
  const { theme, toggleTheme } = useTheme();

  if (variant === "project") {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-content-secondary hover:bg-surface-hover hover:text-content transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-stroke bg-surface hover:bg-surface-hover text-content-secondary transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
