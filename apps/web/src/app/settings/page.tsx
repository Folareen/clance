"use client";

import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { cn } from "@/lib/utils";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn("relative w-10 h-6 rounded-full transition-colors shrink-0", enabled ? "bg-accent" : "bg-surface-active")}
    >
      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", enabled ? "left-5" : "left-1")} />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mentions: true,
    taskUpdates: true,
    approvals: false,
  });

  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-content mb-1">Settings</h1>
        <p className="text-content-secondary mb-8">Manage your account and preferences</p>

        {/* Profile */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">Profile</h2>
          <div className="bg-surface border border-stroke rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-accent-contrast text-2xl font-bold">SA</div>
                <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-content">Saka Wahab</h3>
                <p className="text-content-secondary text-sm">sakawahab03@gmail.com</p>
                <p className="text-content-muted text-sm mt-1">Manager &middot; 4 active projects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full name", value: "Saka Wahab", type: "text" },
                { label: "Email", value: "sakawahab03@gmail.com", type: "email" },
                { label: "Title", value: "Product Manager", type: "text" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-content mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-content mb-1.5">Timezone</label>
                <select className="w-full px-3.5 py-2.5 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none">
                  <option>Africa/Lagos (WAT)</option>
                  <option>UTC</option>
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                <Check className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">Notifications</h2>
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
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">Appearance</h2>
          <div className="bg-surface border border-stroke rounded-xl p-6">
            <p className="text-sm font-medium text-content mb-1">Theme</p>
            <p className="text-sm text-content-muted mb-4">Choose how Clance looks to you</p>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as const).map((option) => {
                const selected = option === theme || (option === "system" && false);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === "system") {
                        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                        setTheme(prefersDark ? "dark" : "light");
                      } else {
                        setTheme(option);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                      selected ? "border-accent bg-accent-soft" : "border-stroke hover:border-accent/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-16 rounded-lg border",
                        option === "light" ? "bg-white border-gray-200" : option === "dark" ? "bg-gray-900 border-gray-700" : "bg-gradient-to-r from-white to-gray-900 border-gray-300"
                      )}
                    />
                    <span className="text-sm font-medium text-content capitalize">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-semibold text-danger uppercase tracking-wider mb-4">Danger Zone</h2>
          <div className="bg-surface border border-danger/20 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-content">Delete account</p>
                <p className="text-sm text-content-muted mt-0.5">Permanently remove your account and all associated data</p>
              </div>
              <button className="px-4 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger-soft transition-colors shrink-0">
                Delete
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
