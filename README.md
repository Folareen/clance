# Clance

One project-shaped home for contract, freelance, part-time, and lean full-time work — replacing the usual pile of PM software + WhatsApp + Docs + Slack with a single space per project.

A project holds its people, tasks, chat, notes, files, and activity log. Each member is scoped per-project as `manager` or `worker`, so the same person can manage one project and just be a contributor on another.

## Features

- **Tasks** — unlimited nested subtasks, multiple assignees, flat and tree views. Status flow: `backlog → in_progress → submitted → approved`, with manager approval and rejection-with-comment.
- **Chat** — group chat, DMs, threads/replies, reactions, @mentions, live task-linking, and pin-as-decision.
- **Notes** — a project-scoped scratchpad that can be pinned alongside chat decisions.
- **Files** — no separate upload flow; attachments live on tasks or messages and inherit that thread's visibility. A personal "All Files" view aggregates everything a member can already see.
- **Search** — text search across tasks, chat, and files, scoped to what the searcher can access.
- **Meetings** — a manual log (title, time, link, notes) optionally tied to a task.
- **AI Assistant** — read-only Q&A over project data (overdue items, what's assigned to you, thread summaries), plus manager-only task drafting that always requires confirmation before creating anything.
- **Dashboards** — role-aware glance views: progress and approvals for managers, pending work and quick actions for workers.
- **Notifications** — in-app, push, and email, with PWA support so push works without a native app.

See [clance.md](clance.md) for the full product spec.

## Tech stack

**Monorepo:** Turborepo + pnpm workspaces

**API** (`apps/api`) — NestJS on Fastify, Drizzle ORM over PostgreSQL, JWT + Google OAuth (Passport), Socket.io for real-time chat/notifications, Resend for email, `web-push` for push notifications, Cloudinary for file storage.

**Web** (`apps/web`) — Next.js 16 (App Router), React 19, Redux Toolkit, Tailwind CSS v4, Tiptap for rich text, Socket.io client.

**Shared** (`packages/types`) — shared TypeScript types across API and web.

## Getting started

### Prerequisites

- Node.js and [pnpm](https://pnpm.io)
- Docker (for local PostgreSQL)

### Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` — at minimum a Postgres user/password/db, a `JWT_SECRET`, and a Resend API key for email. Google OAuth, web push (VAPID), and AI assistant keys (Gemini/Groq) are optional for local dev.

```bash
# start Postgres and push the schema
pnpm db:setup

# run both apps
pnpm dev

# or run one at a time
pnpm dev:api
pnpm dev:web
```

The API runs on `http://localhost:4000`, the web app on `http://localhost:3000`.

### Other useful commands

```bash
pnpm db:studio    # Drizzle Studio
pnpm db:generate  # generate a new migration
pnpm db:migrate   # run migrations
pnpm build        # build all apps
pnpm lint         # lint all apps
```

## Project structure

```
apps/
  api/     NestJS backend (auth, projects, tasks, chat, notes, meetings, search, AI, notifications, push, email)
  web/     Next.js frontend
packages/
  types/   shared types
```
