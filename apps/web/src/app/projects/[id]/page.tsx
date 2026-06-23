import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  FileText,
  Folder,
} from "lucide-react";
import { ProjectAvatar } from "@/components/project-avatar";
import { getProject } from "@/lib/data";

const activity = [
  { user: "Sarah Chen", avatar: "SC", action: "completed", target: "Homepage wireframe", time: "2m ago" },
  { user: "Mike Johnson", avatar: "MJ", action: "commented on", target: "API endpoint design", time: "15m ago" },
  { user: "You", avatar: "SA", action: "were assigned", target: "User authentication flow", time: "1h ago" },
  { user: "Emma Walsh", avatar: "EW", action: "submitted", target: "Logo concepts v2", time: "3h ago" },
];

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const stats = [
    { label: "In progress", value: 8, icon: Clock, color: "text-info bg-info-soft" },
    { label: "Awaiting approval", value: 3, icon: AlertCircle, color: "text-warning bg-warning-soft" },
    { label: "Approved", value: project.tasks.done, icon: CheckCircle2, color: "text-success bg-success-soft" },
    { label: "Unassigned", value: 2, icon: CheckSquare, color: "text-content-secondary bg-surface-hover" },
  ];

  const quickLinks = [
    { name: "Tasks", href: `/projects/${id}/tasks`, icon: CheckSquare, hint: `${project.tasks.total} tasks` },
    { name: "Chat", href: `/projects/${id}/chat`, icon: MessageCircle, hint: "3 unread" },
    { name: "Notes", href: `/projects/${id}/notes`, icon: FileText, hint: "5 notes" },
    { name: "Files", href: `/projects/${id}/files`, icon: Folder, hint: "12 files" },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <ProjectAvatar project={project} size={48} className="rounded-xl" />
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-content">{project.name}</h1>
            <span className="text-xs text-content-muted">
              {project.role === "manager" ? "Manager" : "Worker"}
            </span>
          </div>
          <p className="text-content-secondary mt-1">{project.description}</p>
        </div>
      </div>

      {/* Progress band */}
      <div className="bg-surface border border-stroke rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-content">Overall progress</span>
          <span className="text-sm text-content-secondary">
            {project.tasks.done} of {project.tasks.total} tasks &middot; {project.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${project.progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface border border-stroke rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-content">{s.value}</p>
            <p className="text-sm text-content-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick links */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
            Jump to
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="group flex items-center gap-3 bg-surface border border-stroke rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-hover group-hover:bg-accent-soft flex items-center justify-center transition-colors">
                  <link.icon className="w-5 h-5 text-content-secondary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-content group-hover:text-accent transition-colors">
                    {link.name}
                  </p>
                  <p className="text-xs text-content-muted">{link.hint}</p>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3 mt-8">
            Team
          </h2>
          <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke-secondary">
            {project.members.map((m) => (
              <div key={m.initials} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-xs font-semibold text-accent">
                  {m.initials}
                </div>
                <span className="text-sm font-medium text-content flex-1">{m.name}</span>
                <span className="text-xs text-content-muted capitalize">{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
            Recent activity
          </h2>
          <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke-secondary">
            {activity.map((item, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center text-[10px] font-semibold text-accent shrink-0 mt-0.5">
                    {item.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-content leading-snug">
                      <span className="font-medium">{item.user}</span>{" "}
                      <span className="text-content-secondary">{item.action}</span>{" "}
                      <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-content-muted mt-0.5">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
