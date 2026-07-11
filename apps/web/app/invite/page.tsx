"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordInput } from "@/components/password-input";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";

function InviteFlow() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { status, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  if (!token) {
    return (
      <div className="rounded-lg bg-danger-soft border border-danger/20 px-4 py-4 text-sm text-danger">
        This invite link is missing its token. Ask the project manager to resend
        the invitation.
      </div>
    );
  }

  async function acceptAsSignedIn() {
    setError(null);
    setLoading(true);
    try {
      await api.acceptInvite(token);
      setAccepted(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't accept the invite"
      );
      setLoading(false);
    }
  }

  async function acceptWithSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const trimmed = name.trim();
    try {
      await api.acceptInviteWithSignup({
        token,
        email,
        password,
        first_name: trimmed.split(/\s+/)[0] || undefined,
        last_name: trimmed.split(/\s+/).slice(1).join(" ") || undefined,
      });
      await refreshUser();
      router.push("/app");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't accept the invite"
      );
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-success-soft border border-success/20 px-4 py-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-content">
            You&apos;ve joined the project. Find it on your projects home.
          </p>
        </div>
        <Link
          href="/app"
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors"
        >
          Go to projects
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <p className="text-sm text-content-secondary">
          You&apos;re signed in. Accept the invitation to join the project.
        </p>
        <button
          onClick={acceptAsSignedIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Accept invitation"
          )}
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={acceptWithSignup}>
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <p className="text-sm text-content-secondary">
        Create your account to join. Use the email this invite was sent to.
      </p>
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
          "Join project"
        )}
      </button>

      <p className="text-center text-sm text-content-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign in
        </Link>{" "}
        first, then reopen this link.
      </p>
    </form>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2.5">
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
            Join the project
          </h2>
          <p className="text-content-secondary mb-8">
            You&apos;ve been invited to collaborate on Clance.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
              </div>
            }
          >
            <InviteFlow />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
