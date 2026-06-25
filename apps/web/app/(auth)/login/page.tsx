"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordInput } from "@/components/password-input";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";

function LoginForm() {
  const { login, codeLogin } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [codeStep, setCodeStep] = useState<"idle" | "sending" | "sent">("idle");
  const [codeEmail, setCodeEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (codeStep === "sent") {
      inputRefs.current[0]?.focus();
    }
  }, [codeStep]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, from);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again."
      );
      setLoading(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeEmail.trim()) return;
    setCodeError(null);
    setCodeStep("sending");
    try {
      await api.sendCode(codeEmail.trim());
      setCodeStep("sent");
    } catch (err) {
      setCodeError(
        err instanceof ApiError ? err.message : "Failed to send code. Try again."
      );
      setCodeStep("idle");
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) next[index + i] = d;
      });
      setCode(next);
      const focusIdx = Math.min(index + digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
      if (next.every((d) => d !== "")) {
        verifyCode(next.join(""));
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      verifyCode(next.join(""));
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verifyCode(fullCode: string) {
    setCodeError(null);
    setCodeLoading(true);
    try {
      await codeLogin(codeEmail.trim(), fullCode, from);
    } catch (err) {
      setCodeError(
        err instanceof ApiError ? err.message : "Invalid or expired code"
      );
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setCodeLoading(false);
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
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stroke" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-surface text-content-muted">
                  or
                </span>
              </div>
            </div>

            {codeStep === "idle" || codeStep === "sending" ? (
              <form onSubmit={handleSendCode} className="space-y-3">
                {codeError && (
                  <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
                    {codeError}
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="email"
                    required
                    value={codeEmail}
                    onChange={(e) => setCodeEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={codeStep === "sending"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stroke bg-surface hover:bg-surface-hover text-content text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {codeStep === "sending" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Sign in with email code
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-content-secondary">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-content">{codeEmail}</span>
                  </p>
                </div>

                {codeError && (
                  <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
                    {codeError}
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      disabled={codeLoading}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-stroke bg-surface text-content focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-60"
                    />
                  ))}
                </div>

                {codeLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setCodeStep("idle");
                      setCode(["", "", "", "", "", ""]);
                      setCodeError(null);
                    }}
                    className="text-content-muted hover:text-content transition-colors"
                  >
                    Change email
                  </button>
                  <span className="text-stroke">|</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setCodeError(null);
                      try {
                        await api.sendCode(codeEmail.trim());
                      } catch {
                        setCodeError("Failed to resend code");
                      }
                    }}
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
