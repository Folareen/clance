"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
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
import { Modal } from "@/components/modal";
import { useAuth } from "@/components/auth-provider";
import {
  api,
  ApiError,
  type Project,
  type DashboardStats,
  type ProjectStats,
  type TaskStatus,
} from "@/lib/api";
import { fullName } from "@/lib/display";
import { cn } from "@/lib/utils";
import {
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  EmptyState,
  SkeletonCards,
  Skeleton,
  Alert,
  Progress,
} from "@/components/ui";

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
      href={`/app/projects/${project.id}`}
      className="group bg-surface border border-stroke rounded-xl shadow-xs hover-lift hover:border-accent/40 flex flex-col overflow-hidden"
    >
      <div className="p-5 flex-1">
        <div className="flex items-center gap-3 mb-3">
          <ProjectAvatar project={project} size={40} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-content truncate group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <Badge tone={project.role === "manager" ? "accent" : "neutral"}>
              {project.role}
            </Badge>
          </div>
          <ArrowRight className="w-4 h-4 text-content-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {project.description && (
          <p className="text-sm text-content-secondary line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {project.total_tasks > 0 && (
          <div className="mb-3">
            <Progress
              value={
                ((project.total_tasks - project.open_tasks) /
                  project.total_tasks) *
                100
              }
            />
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-content-muted flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {project.member_count}
          </span>
          <span className="tabular-nums">
            {project.total_tasks} task{project.total_tasks !== 1 ? "s" : ""}
          </span>
          {project.open_tasks > 0 && (
            <span className="text-info tabular-nums">
              {project.open_tasks} open
            </span>
          )}
          {project.overdue_tasks > 0 && (
            <span className="text-danger font-medium tabular-nums">
              {project.overdue_tasks} overdue
            </span>
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
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-8 space-y-2.5">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
          <Skeleton className="h-5 w-32 rounded mb-4" />
          <SkeletonCards count={4} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
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

        {error && <Alert className="mb-6">{error}</Alert>}

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="A project is the home for your people, tasks, chat, notes, and files."
            action={
              <Button icon={Plus} onClick={() => setShowCreate(true)}>
                Create project
              </Button>
            }
          />
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-content">Your projects</h2>
              <Button icon={Plus} onClick={() => setShowCreate(true)}>
                <span className="hidden sm:inline">New project</span>
                <span className="sm:hidden">New</span>
              </Button>
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
            router.push(`/app/projects/${project.id}`);
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
    <Modal
      title="New project"
      description="You'll be added as its manager."
      onClose={onClose}
    >
      <form id="create-project" className="space-y-4" onSubmit={handleSubmit}>
        {error && <Alert>{error}</Alert>}
        <div>
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            type="text"
            required
            autoFocus
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mobile App Redesign"
          />
        </div>
        <div>
          <Label htmlFor="project-desc">
            Description{" "}
            <span className="text-content-muted font-normal">(optional)</span>
          </Label>
          <Textarea
            id="project-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about?"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()} loading={loading}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
