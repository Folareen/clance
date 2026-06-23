"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignupPage() {
  const [name, setName] = useState("");
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

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-content mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="text"
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium py-2.5 rounded-lg transition-colors"
              >
                Create account
                <ArrowRight className="w-4 h-4" />
              </Link>
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
