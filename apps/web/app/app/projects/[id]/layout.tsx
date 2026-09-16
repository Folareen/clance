"use client";

import { use } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectNav, MobileTopBar } from "@/components/project-nav";
import { RequireAuth } from "@/components/require-auth";
import { ProjectProvider, useProject } from "@/components/project-provider";
import { Skeleton, SkeletonRows, Button } from "@/components/ui";

function ProjectShell({ children }: { children: React.ReactNode }) {
  const { project, status, error } = useProject();
  const pathname = usePathname();

  // Chat owns its own scroll regions (message list, thread, channel rail), so
  // the shell must not add another scroll container around it.
  const selfScrolling = pathname.endsWith("/chat");

  if (status === "loading") {
    return (
      <div className="flex h-screen bg-surface-secondary">
        <div className="hidden lg:flex flex-col w-60 min-w-60 bg-nav-bg" />
        <div className="flex-1 min-w-0">
          <div className="h-14 bg-nav-bg lg:hidden" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
            <SkeletonRows rows={5} className="mt-6" />
          </div>
        </div>
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
        <Link href="/app" className="mt-5">
          <Button icon={ArrowLeft}>Back to projects</Button>
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
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <ProjectNav project={project} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar project={project} />
        <main
          className={
            selfScrolling
              ? "flex-1 min-h-0 overflow-hidden pb-bottom-nav lg:pb-0"
              : "flex-1 overflow-y-auto overscroll-none-touch scroll-thin pb-bottom-nav lg:pb-0"
          }
        >
          {children}
        </main>
      </div>
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
