import { Search } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-content mb-4">Search</h1>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, chats, files, and people…"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-stroke bg-surface text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
        </div>

        <PagePlaceholder
          icon={Search}
          title="Search across everything you can see"
          description="Results are scoped to the projects, tasks, and chats you're already a member of."
        />
      </main>
    </div>
  );
}
