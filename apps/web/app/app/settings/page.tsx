"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { TopBar } from "@/components/top-bar";
import { RequireAuth } from "@/components/require-auth";
import { toast } from "@/components/toast";
import { fullName, initials } from "@/lib/display";
import { cn } from "@/lib/utils";
import { isPushSupported, getPushSubscription, enablePush, disablePush } from "@/lib/push";
import { api, ApiError, type NotificationPreferences } from "@/lib/api";

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

const DEFAULT_PREFERENCES: NotificationPreferences = {
  user_id: "",
  email: true,
  mentions: true,
  task_updates: true,
  approvals: true,
};

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    setPushSupported(isPushSupported());
    getPushSubscription().then((sub) => setPushEnabled(!!sub));
  }, []);

  useEffect(() => {
    api
      .getNotificationPreferences()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, []);

  const togglePush = useCallback(async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await disablePush();
        setPushEnabled(false);
      } else {
        const granted = await enablePush();
        if (!granted) {
          toast(
            Notification.permission === "denied"
              ? "Notifications are blocked in your browser settings"
              : "Couldn't enable push notifications"
          );
        }
        setPushEnabled(granted);
      }
    } catch {
      toast("Couldn't update push notifications");
    }
    setPushBusy(false);
  }, [pushEnabled, pushBusy]);

  const toggle = async (key: keyof Omit<NotificationPreferences, "user_id">) => {
    if (savingKey) return;
    const prev = notifications;
    const next = { ...prev, [key]: !prev[key] };
    setNotifications(next);
    setSavingKey(key);
    try {
      await api.updateNotificationPreferences({ [key]: next[key] });
    } catch (err) {
      setNotifications(prev);
      toast(err instanceof ApiError ? err.message : "Couldn't save notification preference");
    }
    setSavingKey(null);
  };

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

        {/* Notifications */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
            Notifications
          </h2>
          <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-content">Email notifications</p>
                <p className="text-sm text-content-muted mt-0.5">
                  Receive email updates for important events
                </p>
              </div>
              <Toggle
                enabled={notifications.email}
                onToggle={prefsLoading ? () => {} : () => toggle("email")}
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-content">Push notifications</p>
                <p className="text-sm text-content-muted mt-0.5">
                  {pushSupported
                    ? "Get notified in this browser, even when Clance isn't open"
                    : "Not supported in this browser"}
                </p>
              </div>
              <Toggle
                enabled={pushEnabled}
                onToggle={pushSupported && !pushBusy ? togglePush : () => {}}
              />
            </div>
            {[
              { key: "mentions" as const, title: "@Mentions", description: "When someone mentions you in a message or comment" },
              { key: "task_updates" as const, title: "Task updates", description: "When tasks you're assigned to or watching are updated" },
              { key: "approvals" as const, title: "Approval requests", description: "When a team member submits work for your review" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-content">{item.title}</p>
                  <p className="text-sm text-content-muted mt-0.5">{item.description}</p>
                </div>
                <Toggle
                  enabled={notifications[item.key]}
                  onToggle={prefsLoading ? () => {} : () => toggle(item.key)}
                />
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
