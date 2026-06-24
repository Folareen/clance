import { Folder } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { PagePlaceholder } from "@/components/page-placeholder";
import { RequireAuth } from "@/components/require-auth";

export default function AllFilesPage() {
  return (
    <RequireAuth>
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-content">All Files</h1>
          <p className="text-content-secondary mt-1">
            Every attachment from every task and chat you&apos;re a member of,
            across all projects
          </p>
        </div>

        <PagePlaceholder
          icon={Folder}
          title="No files yet"
          description="This is your personal view — files aggregate here automatically from the tasks and chats you belong to."
        />
      </main>
    </div>
    </RequireAuth>
  );
}
