"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordInput } from "@/components/password-input";
import { api, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg bg-danger-soft border border-danger/20 px-4 py-4 text-sm text-danger">
        This reset link is missing its token. Request a new one from the{" "}
        <Link href="/forgot-password" className="underline">
          forgot password
        </Link>{" "}
        page.
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-success-soft border border-success/20 px-4 py-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-content">
            Your password has been reset. You can now sign in with your new
            password.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full flex items-center justify-center bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-content mb-1.5">
          New password
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
        className="w-full flex items-center justify-center bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            Choose a new password
          </h2>
          <p className="text-content-secondary mb-8">
            Pick something secure you haven&apos;t used before.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

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
