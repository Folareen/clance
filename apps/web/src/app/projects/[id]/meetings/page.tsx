import { Video, Plus } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ProjectMeetings() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content">Meetings</h1>
          <p className="text-content-secondary mt-1">
            Zoom &amp; Meet calls, embedded and logged
          </p>
        </div>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      <PagePlaceholder
        icon={Video}
        title="No meetings yet"
        description="Start a meeting from a task or chat and it'll show up here, tied to the activity log."
      />
    </div>
  );
}
