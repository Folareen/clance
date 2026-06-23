import { notFound } from "next/navigation";
import { ProjectNav } from "@/components/project-nav";
import { getProject } from "@/lib/data";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) notFound();

  return (
    <div className="flex h-screen bg-surface-secondary">
      <ProjectNav project={project} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
    </div>
  );
}
