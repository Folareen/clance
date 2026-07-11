"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how-it-works" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-stroke">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-content font-semibold text-lg tracking-tight">
            Clance
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-3 py-2 rounded-lg text-content-secondary hover:text-content hover:bg-surface-hover transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <ThemeToggle variant="inline" />
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-content-secondary hover:text-content hover:bg-surface-hover transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors"
          >
            Get started
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="ml-auto md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-stroke bg-surface text-content-secondary"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
    </header>

    {open && (
      <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-surface flex flex-col animate-menu-in">
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3.5 py-3.5 rounded-lg text-base font-medium text-content hover:bg-surface-hover transition-colors"
            >
              {link.name}
              <ChevronRight className="w-4 h-4 text-content-muted" />
            </a>
          ))}
        </nav>

        <div className="shrink-0 border-t border-stroke px-3 py-3 space-y-3">
          <ThemeToggle variant="project" />
          <div className="flex flex-col gap-2">
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="w-full text-center px-4 py-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-accent-contrast transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full text-center px-4 py-3 rounded-lg text-sm font-medium border border-stroke text-content hover:bg-surface-hover transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
