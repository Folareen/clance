"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Loader2,
  FolderPlus,
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { ProjectAvatar } from "@/components/project-avatar";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import {
  api,
  ApiError,
  type Project,
  type DashboardStats,
  type ProjectStats,
  type ProjectRecentTask,
  type TaskStatus,
} from "@/lib/api";
import { fullName } from "@/lib/display";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const statusIcon: Record<TaskStatus, typeof Circle> = {
  backlog: Circle,
  in_progress: Clock,
  submitted: AlertCircle,
  approved: CheckCircle2,
};

const statusClass: Record<TaskStatus, string> = {
  backlog: "text-content-muted",
  in_progress: "text-info",
  submitted: "text-warning",
  approved: "text-success",
};

function ProjectCard({ project }: { project: ProjectStats }) {
  const hasActivity = project.recent_tasks.length > 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-surface border border-stroke rounded-xl hover:border-accent/40 transition-colors flex flex-col"
    >
      <div className="p-5 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <ProjectAvatar project={project} size={40} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-content truncate group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-content-muted capitalize">{project.role}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {project.description && (
          <p className="text-sm text-content-secondary line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-content-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {project.member_count}
          </span>
          <span>
            {project.total_tasks} task{project.total_tasks !== 1 ? "s" : ""}
          </span>
          {project.open_tasks > 0 && (
            <span className="text-info">{project.open_tasks} open</span>
          )}
          {project.overdue_tasks > 0 && (
            <span className="text-danger">{project.overdue_tasks} overdue</span>
          )}
        </div>
      </div>

      {hasActivity && (
        <div className="border-t border-stroke-secondary px-5 py-3 space-y-1.5">
          <span className="text-[11px] font-medium text-content-muted uppercase tracking-wider">
            Recent
          </span>
          {project.recent_tasks.map((task) => {
            const Icon = statusIcon[task.status];
            return (
              <div key={task.id} className="flex items-center gap-2">
                <Icon className={cn("w-3 h-3 shrink-0", statusClass[task.status])} />
                <span className="text-xs text-content-muted font-mono shrink-0">
                  #{task.task_number}
                </span>
                <span className="text-xs text-content truncate">{task.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getDashboardStats()
      .then((data) => active && setStats(data))
      .catch((err) => {
        if (active)
          setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const firstName = fullName(user).split(" ")[0];
  const projects = stats?.projects ?? [];
  const myTasks = projects.reduce((sum, p) => sum + p.my_tasks, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <TopBar />
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="mb-8">
          <h1 className="text-2xl font-semibold text-content tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-content-secondary mt-1">
            {projects.length === 0
              ? "Create your first project to get started."
              : `You're in ${projects.length} project${projects.length !== 1 ? "s" : ""}${myTasks ? ` with ${myTasks} active task${myTasks !== 1 ? "s" : ""} assigned to you.` : "."}`}
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger-soft px-5 py-4 text-sm text-danger mb-6">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-stroke rounded-xl bg-surface">
            <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
              <FolderPlus className="w-6 h-6 text-content-muted" />
            </div>
            <h3 className="text-base font-semibold text-content">No projects yet</h3>
            <p className="text-sm text-content-secondary mt-1.5 max-w-sm">
              A project is the home for your people, tasks, chat, notes, and files.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create project
            </button>
          </div>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-content">Your projects</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-3.5 py-2 rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New project
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(project) => {
            setShowCreate(false);
            router.push(`/projects/${project.id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const project = await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(project);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-stroke rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-content mb-1">New project</h2>
        <p className="text-sm text-content-secondary mb-5">
          You&apos;ll be added as its manager.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">Name</label>
            <input
              type="text"
              required
              autoFocus
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">
              Description <span className="text-content-muted font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project about?"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stroke text-content-secondary hover:bg-surface-hover text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[110px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
