import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { ProjectAvatar } from "@/components/project-avatar";
import { projects, currentUser } from "@/lib/data";

const glance = [
  { label: "Due today", value: 6 },
  { label: "Awaiting your approval", value: 3 },
  { label: "Submitted by you", value: 4 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Cockpit */}
        <section className="mb-10">
          <h1 className="text-2xl font-semibold text-content tracking-tight">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-content-secondary mt-1.5">
            Your work across {projects.length} projects.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {glance.map((g) => (
              <div
                key={g.label}
                className="bg-surface border border-stroke rounded-xl px-5 py-4"
              >
                <span className="text-2xl font-semibold text-content">
                  {g.value}
                </span>
                <p className="text-sm text-content-secondary mt-1">{g.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-content">
              Your projects
            </h2>
            <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-3.5 py-2 rounded-lg transition-colors text-sm">
              <Plus className="w-4 h-4" />
              New project
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group bg-surface border border-stroke rounded-xl hover:border-accent/40 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <ProjectAvatar project={project} size={40} />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-content truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-content-muted truncate">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 text-xs text-content-muted">
                    <span>{project.role === "manager" ? "Manager" : "Worker"}</span>
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {project.tasks.done}/{project.tasks.total}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-content-muted mb-1.5">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stroke-secondary">
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 4).map((m) => (
                        <div
                          key={m.initials}
                          className="w-6 h-6 rounded-full bg-surface-active border-2 border-surface flex items-center justify-center text-[10px] font-medium text-content-secondary"
                          title={m.name}
                        >
                          {m.initials}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-content-muted">
                      {project.members.length} members
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
