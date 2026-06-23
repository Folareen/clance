"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-nav-bg flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white font-semibold text-2xl tracking-tight">
            Clance
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
            Your projects, your people, one place.
          </h1>
          <p className="text-white/50 text-lg max-w-md leading-relaxed">
            The project home for contract, freelance, and lean teams. Replace
            your PM tool, WhatsApp, Docs, and Slack.
          </p>
        </div>

        <p className="text-white/30 text-sm">&copy; 2026 Clance</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeToggle variant="inline" />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-content font-semibold text-xl tracking-tight">
                Clance
              </span>
            </div>

            <h2 className="text-2xl font-semibold text-content mb-1">
              Welcome back
            </h2>
            <p className="text-content-secondary mb-8">
              Sign in to your account to continue
            </p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-content">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-accent hover:text-accent-hover transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stroke" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-surface text-content-muted">
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stroke bg-surface hover:bg-surface-hover text-content text-sm font-medium transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stroke bg-surface hover:bg-surface-hover text-content text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            <p className="text-center text-sm text-content-secondary mt-8">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
