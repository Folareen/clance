"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  MessageCircle,
  FileText,
  Folder,
  Plus,
  Loader2,
  UserPlus,
  X,
  LogOut,
} from "lucide-react";
import { ProjectAvatar } from "@/components/project-avatar";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { api, ApiError, type Member, type Role } from "@/lib/api";
import { memberDisplayName } from "@/lib/display";
import { cn } from "@/lib/utils";

export default function ProjectOverview() {
  const { project, reload } = useProject();
  const { user } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  if (!project) return null;

  const me = project.members.find((m) => m.user_id === user?.id);
  const isManager = me?.role === "manager";

  const quickLinks = [
    { name: "Tasks", href: `/projects/${project.id}/tasks`, icon: CheckSquare },
    { name: "Chat", href: `/projects/${project.id}/chat`, icon: MessageCircle },
    { name: "Notes", href: `/projects/${project.id}/notes`, icon: FileText },
    { name: "Files", href: `/projects/${project.id}/files`, icon: Folder },
  ];

  async function handleLeave() {
    if (!confirm("Leave this project? Your assigned tasks become unassigned."))
      return;
    setLeaveError(null);
    setLeaving(true);
    try {
      await api.leaveProject(project!.id);
      router.push("/");
    } catch (err) {
      setLeaveError(
        err instanceof ApiError ? err.message : "Couldn't leave the project"
      );
      setLeaving(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <ProjectAvatar project={project} size={48} className="rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-content">
              {project.name}
            </h1>
            {me && (
              <span className="text-xs text-content-muted capitalize">
                {me.role}
              </span>
            )}
          </div>
          <p className="text-content-secondary mt-1">
            {project.description || "No description yet."}
          </p>
        </div>
        {me && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex items-center gap-1.5 text-sm text-content-secondary hover:text-danger transition-colors disabled:opacity-60"
          >
            {leaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Leave
          </button>
        )}
      </div>

      {leaveError && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger mb-6">
          {leaveError}
        </div>
      )}

      {/* Jump to */}
      <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-3">
        Jump to
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group flex flex-col gap-3 bg-surface border border-stroke rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-hover group-hover:bg-accent-soft flex items-center justify-center transition-colors">
              <link.icon className="w-5 h-5 text-content-secondary group-hover:text-accent transition-colors" />
            </div>
            <span className="font-medium text-content group-hover:text-accent transition-colors">
              {link.name}
            </span>
          </Link>
        ))}
      </div>

      {/* People */}
      <PeopleSection
        projectId={project.id}
        members={project.members}
        isManager={isManager}
        currentUserId={user?.id}
        onChange={reload}
      />
    </div>
  );
}

function PeopleSection({
  projectId,
  members,
  isManager,
  currentUserId,
  onChange,
}: {
  projectId: string;
  members: Member[];
  isManager: boolean;
  currentUserId: string | undefined;
  onChange: () => Promise<void>;
}) {
  const [showInvite, setShowInvite] = useState(false);

  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-content uppercase tracking-wider">
          People <span className="text-content-muted">({active.length})</span>
        </h2>
        {isManager && (
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>

      {isManager && showInvite && (
        <InviteForm
          projectId={projectId}
          onInvited={async () => {
            setShowInvite(false);
            await onChange();
          }}
        />
      )}

      <div className="bg-surface border border-stroke rounded-xl divide-y divide-stroke-secondary">
        {[...active, ...pending].map((m) => (
          <MemberRow
            key={m.id}
            projectId={projectId}
            member={m}
            isManager={isManager}
            isSelf={!!currentUserId && m.user_id === currentUserId}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

function InviteForm({
  projectId,
  onInvited,
}: {
  projectId: string;
  onInvited: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.inviteMember(projectId, { email: email.trim(), role });
      setEmail("");
      await onInvited();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-stroke rounded-xl p-4 mb-3"
    >
      {error && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3 py-2 text-sm text-danger mb-3">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          className="flex-1 px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="px-3 py-2 rounded-lg border border-stroke bg-surface text-content text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        >
          <option value="worker">Worker</option>
          <option value="manager">Manager</option>
        </select>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Send invite
        </button>
      </div>
    </form>
  );
}

function MemberRow({
  projectId,
  member,
  isManager,
  isSelf,
  onChange,
}: {
  projectId: string;
  member: Member;
  isManager: boolean;
  isSelf: boolean;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const name = memberDisplayName(member);

  async function changeRole(role: Role) {
    setBusy(true);
    try {
      await api.updateMember(projectId, member.id, { role });
      await onChange();
    } catch {
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${member.email} from this project?`)) return;
    setBusy(true);
    try {
      await api.removeMember(projectId, member.id);
      await onChange();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
          member.status === "pending"
            ? "bg-surface-hover text-content-muted"
            : "bg-accent-soft text-accent"
        )}
      >
        {member.email.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-content truncate">
          {name}
          {isSelf && (
            <span className="text-content-muted font-normal"> (you)</span>
          )}
        </p>
        <p className="text-xs text-content-muted truncate">{member.email}</p>
      </div>

      {member.status === "pending" && (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-warning-soft text-warning">
          Invited
        </span>
      )}

      {isManager && !isSelf ? (
        <select
          value={member.role}
          disabled={busy}
          onChange={(e) => changeRole(e.target.value as Role)}
          className="text-xs px-2 py-1 rounded-md border border-stroke bg-surface text-content-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
        >
          <option value="worker">Worker</option>
          <option value="manager">Manager</option>
        </select>
      ) : (
        <span className="text-xs text-content-muted capitalize">
          {member.role}
        </span>
      )}

      {isManager && !isSelf && (
        <button
          onClick={remove}
          disabled={busy}
          className="text-content-muted hover:text-danger transition-colors disabled:opacity-60"
          title="Remove member"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
