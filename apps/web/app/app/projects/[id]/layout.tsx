"use client";

import { use } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { ProjectNav } from "@/components/project-nav";
import { RequireAuth } from "@/components/require-auth";
import { ProjectProvider, useProject } from "@/components/project-provider";

function ProjectShell({ children }: { children: React.ReactNode }) {
  const { project, status, error } = useProject();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-secondary">
        <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface-secondary text-center px-6">
        <h1 className="text-xl font-semibold text-content">Project not found</h1>
        <p className="text-content-secondary mt-1.5 max-w-sm">
          It may have been deleted, or you don&apos;t have access to it.
        </p>
        <Link
          href="/app"
          className="mt-5 inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
      </div>
    );
  }

  if (status === "error" || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface-secondary text-center px-6">
        <p className="text-danger">{error ?? "Something went wrong."}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-secondary">
      <ProjectNav project={project} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
    </div>
  );
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RequireAuth>
      <ProjectProvider id={id}>
        <ProjectShell>{children}</ProjectShell>
      </ProjectProvider>
    </RequireAuth>
  );
}
