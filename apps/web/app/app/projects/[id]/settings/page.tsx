"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  UserPlus,
  X,
  LogOut,
  Trash2,
  Check,
} from "lucide-react";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError, type Member, type Role } from "@/lib/api";
import { memberDisplayName } from "@/lib/display";
import { ConfirmModal } from "@/components/confirm-modal";
import { cn } from "@/lib/utils";

export default function ProjectSettings() {
  const { project, reload } = useProject();
  const { user } = useAuth();

  if (!project) return null;

  const me = project.members.find((m) => m.user_id === user?.id);
  const isManager = me?.role === "manager";

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-content mb-1">
        Project settings
      </h1>
      <p className="text-content-secondary mb-8">
        Manage {project.name}&apos;s details, members, and access
      </p>

      <GeneralSection
        projectId={project.id}
        name={project.name}
        description={project.description}
        isManager={isManager}
        onChange={reload}
      />

      <PeopleSection
        projectId={project.id}
        members={project.members}
        isManager={isManager}
        currentUserId={user?.id}
        onChange={reload}
      />

      <DangerSection
        projectId={project.id}
        projectName={project.name}
        isManager={isManager}
        canLeave={!!me}
      />
    </div>
  );
}

function GeneralSection({
  projectId,
  name,
  description,
  isManager,
  onChange,
}: {
  projectId: string;
  name: string;
  description: string | null;
  isManager: boolean;
  onChange: () => Promise<void>;
}) {
  const [nameValue, setNameValue] = useState(name);
  const [descValue, setDescValue] = useState(description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = nameValue.trim() !== name || descValue.trim() !== (description ?? "");

  async function save() {
    if (!nameValue.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await api.updateProject(projectId, {
        name: nameValue.trim(),
        description: descValue.trim(),
      });
      await onChange();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-content uppercase tracking-wider mb-4">
        General
      </h2>
      <div className="bg-surface border border-stroke rounded-xl p-6">
        {error && (
          <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger mb-4">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">
              Project name
            </label>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              disabled={!isManager}
              className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1.5">
              Description
            </label>
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              disabled={!isManager}
              rows={3}
              placeholder="No description yet."
              className="w-full px-3.5 py-2 rounded-lg border border-stroke bg-surface text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {isManager && (
          <div className="flex justify-end mt-4">
            <button
              onClick={save}
              disabled={saving || !dirty || !nameValue.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-contrast text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        )}
      </div>
    </section>
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
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const name = memberDisplayName(member);

  async function changeRole(role: Role) {
    setRoleError(null);
    setBusy(true);
    try {
      await api.updateMember(projectId, member.id, { role });
      await onChange();
    } catch (err) {
      setRoleError(err instanceof ApiError ? err.message : "Couldn't change role");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.removeMember(projectId, member.id);
      await onChange();
    } catch {
      setBusy(false);
      setShowRemoveConfirm(false);
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
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
            onClick={() => setShowRemoveConfirm(true)}
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

      {roleError && (
        <p className="text-xs text-danger mt-1.5">{roleError}</p>
      )}

      {showRemoveConfirm && (
        <ConfirmModal
          title="Remove member"
          message={`Remove ${member.email} from this project? Their assigned tasks will become unassigned.`}
          confirmLabel="Remove"
          loading={busy}
          onConfirm={remove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}

function DangerSection({
  projectId,
  projectName,
  isManager,
  canLeave,
}: {
  projectId: string;
  projectName: string;
  isManager: boolean;
  canLeave: boolean;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleLeave() {
    setLeaveError(null);
    setLeaving(true);
    try {
      await api.leaveProject(projectId);
      router.push("/app");
    } catch (err) {
      setLeaveError(
        err instanceof ApiError ? err.message : "Couldn't leave the project"
      );
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.deleteProject(projectId);
      router.push("/app");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Couldn't delete the project"
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!canLeave && !isManager) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-danger uppercase tracking-wider mb-4">
        Danger zone
      </h2>
      <div className="bg-surface border border-danger/20 rounded-xl divide-y divide-danger/10">
        {canLeave && (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-content">Leave project</p>
              <p className="text-sm text-content-muted mt-0.5">
                You&apos;ll lose access and your assigned tasks will become unassigned
              </p>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              disabled={leaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 text-sm font-medium transition-colors disabled:opacity-60 shrink-0"
            >
              {leaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Leave
            </button>
          </div>
        )}

        {isManager && (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-content">Delete project</p>
              <p className="text-sm text-content-muted mt-0.5">
                Permanently delete {projectName} and all of its data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 text-sm font-medium transition-colors disabled:opacity-60 shrink-0"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        )}
      </div>

      {leaveError && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger mt-4">
          {leaveError}
        </div>
      )}
      {deleteError && (
        <div className="rounded-lg bg-danger-soft border border-danger/20 px-3.5 py-2.5 text-sm text-danger mt-4">
          {deleteError}
        </div>
      )}

      {showLeaveConfirm && (
        <ConfirmModal
          title="Leave project"
          message="Your assigned tasks will become unassigned. This action cannot be undone."
          confirmLabel="Leave"
          loading={leaving}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete project"
          message={`This will permanently delete ${projectName} and all of its tasks, chat, notes, and files. This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </section>
  );
}
