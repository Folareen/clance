# Clance — MVP Spec

One project-shaped home for contract, freelance, part-time, and lean full-time work. Replaces PM software + WhatsApp + Docs + Slack.

---

## 1. Core Object: Project

No workspace layer. A Project is the only top-level thing you create. It holds people, tasks, chat, notes, files, and an activity log.

---

## 2. People & Roles

One field per person, per project:

**role**
- `manager` — edits project settings, invites/removes members, can promote/demote roles, approves tasks
- `worker` — delivers work, submits tasks

Scoped per-project — same person can be manager on one project and worker on another. Multiple managers allowed per project, no hierarchy among them. A free-text/picklist label (frontend, QA, founder, etc.) sits on top of `role` for identification only — no permission weight of its own.

**Creating a project:** the creator is automatically `manager`. A manager can later promote another member to manager, or demote a manager to worker.

**Multi-manager approval:** any manager can approve a task. First approval stands.

**Invite flow:** manager invites by email with initial role → if no account exists, accepting the invite creates one automatically → lands in project directly → profile completion happens later, not a gate.

**On removal:** member's assigned tasks fall back to `unassigned`, open for anyone to pick up.

---

## 3. Tasks

- Unlimited nested subtasks (no separate milestone object).
- Multiple assignees per task; anyone assigned can submit it.
- Two views: flat list (with parent chain shown) and tree view.
- Fields: title, status, priority, due date/time, assignee(s), parent reference(s), ID.

**Status flow:**
```
backlog → in_progress → submitted → approved
```
Status is independent of assignment — a task can sit in `backlog` whether or not anyone's assigned to it yet.
- Worker → `submitted` when done.
- Any manager → `approved` (done), or rejects back to an earlier status with a comment.
- Parent task can only become `approved` once all its subtasks are `approved`.

**Comments:** every task has its own thread, same engine as chat.

**Attachments:** files attach directly to a task. Visibility = anyone who can see the task can see its files.

---

## 4. Notes

Simple project-scoped scratchpad (plain/rich text). Can be pinned, same as a chat decision.

---

## 5. Chat

One messaging engine powers group chat, DMs, and task comments.

- Group chat (project-wide) + personal DMs
- Threads/replies on any message
- Reactions
- @mentions with notification
- Task tagging — renders as a live link/preview, not plain text
- Pin as decision — surfaces a message and logs it as a decision of record

**Attachments:** files attach directly to any message. Visibility = anyone in that chat/DM can see its files.

---

## 6. Files

No separate upload flow, no per-file permissions. Files only exist as attachments on a task or a chat/DM, and visibility is inherited from that task/chat's existing members.

- Per-task and per-chat attachment views (automatic, scoped to existing members)
- **All Files** — one aggregated screen per person, pulling every attachment from every task/chat *they're already a member of*. Not a project-wide view — purely personal aggregation.

---

## 7. Search

Basic text search across tasks, chat, and the All Files view — scoped to what the searching person can already see.

---

## 8. Meetings

Manual log, not an embedded call. A member logs a meeting (title, date/time, own paste-in link for whatever tool they used, notes), optionally tied to a task via a picker in the create/edit modal. Logged in the activity log.

Meetings can only be logged from the dedicated Meetings page — no shortcut from a chat message or a task's own panel (deliberately out of scope for now).

---

## 9. AI Assistant (Basic)

- **Read-only Q&A** over existing project data: overdue items, what's assigned to me, unsubmitted tasks, thread summaries.
- **Task drafting, manager-only** — assistant fills a structured draft (title, assignee, priority, parent); manager must confirm/edit before it's created. Never auto-creates.

---

## 10. Dashboards

Same project, different glance view depending on role.

**Worker:**
- My pending tasks (by due date/priority)
- Tasks awaiting my action (revision needed, blocked on me)
- Recent activity on my work
- Quick submit/mark-done action

**Manager:**
- Overall progress (done/total)
- What's awaiting my approval
- What's blocked/overdue, and who it's blocked on

---

## 11. Notifications

In-app + push + email. PWA support (manifest + service worker) so push works without a native app.

Triggers: @mentions, assignment, submission, approval/rejection, pinned decisions, meeting creation.

---

## 12. Page List

1. Dashboard — project list, create project, per-role glance
2. Tasks — flat/tree views, detail, comments, attachments, subtasks
3. Chat — group + DM, threads, reactions, mentions, tagging, pinning
4. Notes
5. All Files
6. Search
7. Meetings
8. AI Assistant
9. Activity Log (underlies all of the above)
10. Notifications