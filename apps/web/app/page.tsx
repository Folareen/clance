"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, FolderPlus } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { ProjectAvatar } from "@/components/project-avatar";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError, type Project } from "@/lib/api";
import { fullName } from "@/lib/display";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .listProjects()
      .then((data) => active && setProjects(data))
      .catch(
        (err) =>
          active &&
          setError(err instanceof ApiError ? err.message : "Failed to load projects")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const managing = projects.filter((p) => p.role === "manager").length;
  const firstName = fullName(user).split(" ")[0];

  return (
    <div className="min-h-screen bg-surface-secondary">
      <TopBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="mb-10">
          <h1 className="text-2xl font-semibold text-content tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-content-secondary mt-1.5">
            {projects.length === 0
              ? "Create your first project to get started."
              : `You're in ${projects.length} ${
                  projects.length === 1 ? "project" : "projects"
                }${managing ? `, managing ${managing}.` : "."}`}
          </p>
        </section>

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

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/20 bg-danger-soft px-5 py-4 text-sm text-danger">
              {error}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-stroke rounded-xl bg-surface">
              <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                <FolderPlus className="w-6 h-6 text-content-muted" />
              </div>
              <h3 className="text-base font-semibold text-content">
                No projects yet
              </h3>
              <p className="text-sm text-content-secondary mt-1.5 max-w-sm">
                A project is the home for your people, tasks, chat, notes, and
                files.
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
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-content-muted">
                      <span className="capitalize">{project.role}</span>
                      <span>
                        {new Date(project.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
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
            <label className="block text-sm font-medium text-content mb-1.5">
              Name
            </label>
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
              Description{" "}
              <span className="text-content-muted font-normal">(optional)</span>
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
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create project"
              )}
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
