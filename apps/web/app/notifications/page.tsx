import { Bell, CheckCheck } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { PagePlaceholder } from "@/components/page-placeholder";
import { RequireAuth } from "@/components/require-auth";

export default function NotificationsPage() {
  return (
    <RequireAuth>
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-content">
              Notifications
            </h1>
            <p className="text-content-secondary mt-1">
              Mentions, assignments, approvals, and more
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm text-content-secondary hover:text-content transition-colors">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>

        <PagePlaceholder
          icon={Bell}
          title="You're all caught up"
          description="New notifications about your tasks, mentions, and approvals will show up here."
        />
      </main>
    </div>
    </RequireAuth>
  );
}
