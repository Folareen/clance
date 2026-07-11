"use client";

import { Sparkles } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function ProjectAssistant() {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-content flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-accent" />
        AI Assistant
      </h1>
      <p className="text-content-secondary mb-8">
        Ask about this project — read-only answers over your data
      </p>

      <PagePlaceholder
        icon={Sparkles}
        title="Coming soon"
        description="We're building a smarter assistant for this project — read-only Q&A over your tasks and chat, plus manager-reviewed task drafting. Check back soon."
      />
    </div>
  );
}
