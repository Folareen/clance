"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, User, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordInput } from "@/components/password-input";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const trimmed = name.trim();
    const first_name = trimmed.split(/\s+/)[0] || undefined;
    const last_name =
      trimmed.split(/\s+/).slice(1).join(" ") || undefined;
    try {
      await signup({ email, password, first_name, last_name });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again."
      );
      setLoading(false);
    }
  }

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
            Start running your projects the simple way.
          </h1>
          <p className="text-white/50 text-lg max-w-md leading-relaxed">
            People, tasks, chat, notes, and files — one home per project. No
            tool-juggling.
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
              Create your account
            </h2>
            <p className="text-content-secondary mb-8">
              Free to start. No credit card required.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Saka Wahab"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-content-secondary mt-8">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
