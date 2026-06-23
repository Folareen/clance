import { Activity } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ProjectActivity() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-content">Activity Log</h1>
        <p className="text-content-secondary mt-1">
          Every status change, approval, edit, and upload — timestamped
        </p>
      </div>

      <PagePlaceholder
        icon={Activity}
        title="Activity will appear here"
        description="A running record of everything that happens in this project, visible to managers and workers alike."
      />
    </div>
  );
}
