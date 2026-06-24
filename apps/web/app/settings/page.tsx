"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { TopBar } from "@/components/top-bar";
import { RequireAuth } from "@/components/require-auth";
import { fullName, initials } from "@/lib/display";
import { cn } from "@/lib/utils";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-10 h-6 rounded-full transition-colors shrink-0",
        enabled ? "bg-accent" : "bg-surface-active"
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
          enabled ? "left-5" : "left-1"
        )}
      />
    </button>
  );
}

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mentions: true,
    taskUpdates: true,
    approvals: false,
  });

  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const name = fullName(user);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-content mb-1">Settings</h1>
        <p className="text-content-secondary mb-8">
          Manage your account and preferences
        </p>

        {/* Profile */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
            Profile
          </h2>
          <div className="bg-surface border border-stroke rounded-xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-accent-contrast text-xl font-bold">
                {initials(name) || "?"}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-content truncate">
                  {name || "Your account"}
                </h3>
                <p className="text-content-secondary text-sm truncate">
                  {user?.email}
                </p>
                {user?.created_at && (
                  <p className="text-content-muted text-sm mt-0.5">
                    Joined{" "}
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications (local preference demo) */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
            Notifications
          </h2>
          <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke">
            {[
              { key: "email" as const, title: "Email notifications", description: "Receive email updates for important events" },
              { key: "push" as const, title: "Push notifications", description: "Get notified in your browser or mobile device" },
              { key: "mentions" as const, title: "@Mentions", description: "When someone mentions you in a message or comment" },
              { key: "taskUpdates" as const, title: "Task updates", description: "When tasks you're assigned to or watching are updated" },
              { key: "approvals" as const, title: "Approval requests", description: "When a team member submits work for your review" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-content">{item.title}</p>
                  <p className="text-sm text-content-muted mt-0.5">{item.description}</p>
                </div>
                <Toggle enabled={notifications[item.key]} onToggle={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
            Appearance
          </h2>
          <div className="bg-surface border border-stroke rounded-xl p-6">
            <p className="text-sm font-medium text-content mb-1">Theme</p>
            <p className="text-sm text-content-muted mb-4">
              Choose how Clance looks to you
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((option) => {
                const selected = option === theme;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === "system") {
                        const prefersDark = window.matchMedia(
                          "(prefers-color-scheme: dark)"
                        ).matches;
                        setTheme(prefersDark ? "dark" : "light");
                      } else {
                        setTheme(option);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                      selected
                        ? "border-accent bg-accent-soft"
                        : "border-stroke hover:border-accent/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-16 rounded-lg border",
                        option === "light"
                          ? "bg-white border-gray-200"
                          : option === "dark"
                            ? "bg-gray-900 border-gray-700"
                            : "bg-gradient-to-r from-white to-gray-900 border-gray-300"
                      )}
                    />
                    <span className="text-sm font-medium text-content capitalize">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
            Account
          </h2>
          <div className="bg-surface border border-stroke rounded-xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-content">Sign out</p>
                <p className="text-sm text-content-muted mt-0.5">
                  Sign out of Clance on this device
                </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stroke text-content-secondary hover:text-content hover:bg-surface-hover text-sm font-medium transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
