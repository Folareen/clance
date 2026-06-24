"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.requestReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="flex items-center justify-between p-4">
        <Link href="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-content font-semibold text-lg tracking-tight">
            Clance
          </span>
        </Link>
        <ThemeToggle variant="inline" />
      </div>

      <div className="flex-1 flex items-center justify-center px-8 pb-20">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-content mb-1">
            Reset your password
          </h2>
          <p className="text-content-secondary mb-8">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <div className="rounded-lg bg-success-soft border border-success/20 px-4 py-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <p className="text-sm text-content">
                If an account exists for <strong>{email}</strong>, a reset link
                is on its way. Check your inbox.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
                  {error}
                </div>
              )}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-content-secondary hover:text-content transition-colors mt-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
