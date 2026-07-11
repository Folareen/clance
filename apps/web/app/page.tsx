import Link from "next/link";
import {
  ArrowRight,
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pin,
  MessagesSquare,
  UserCheck,
  FolderX,
  Layers,
  LayoutDashboard,
  Sparkles,
  Video,
  Bell,
  Search,
  Activity,
  FolderPlus,
  UserPlus,
  Zap,
  FileText,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
      {children}
    </span>
  );
}

function TaskMockup() {
  const rows = [
    { icon: CheckCircle2, cls: "text-success", num: "9", title: "Kickoff call notes", who: "PS" },
    { icon: AlertCircle, cls: "text-warning", num: "12", title: "Fix onboarding empty state", who: "SK" },
    { icon: Clock, cls: "text-info", num: "14", title: "Wire up push notifications", who: "AM" },
    { icon: Circle, cls: "text-content-muted", num: "15", title: "Redesign settings page", who: "—" },
  ];
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-surface shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 h-12 border-b border-stroke">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] font-bold">C</span>
        </div>
        <span className="text-sm font-semibold text-content truncate">
          Mobile App Redesign
        </span>
        <span className="ml-auto text-xs text-content-muted shrink-0">4 members</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-3 p-5">
          <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">
            Tasks
          </p>
          <div className="space-y-0.5">
            {rows.map((r) => (
              <div
                key={r.num}
                className="flex items-center gap-2.5 py-2 border-b border-stroke-secondary last:border-0"
              >
                <r.icon className={`w-3.5 h-3.5 shrink-0 ${r.cls}`} />
                <span className="text-xs text-content-muted font-mono shrink-0">
                  #{r.num}
                </span>
                <span className="text-sm text-content truncate flex-1">{r.title}</span>
                <span className="w-5 h-5 rounded-full bg-accent-soft text-accent text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {r.who}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 p-5 border-t md:border-t-0 md:border-l border-stroke bg-surface-secondary/50">
          <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">
            Chat
          </p>
          <div className="flex items-start gap-1.5 rounded-lg bg-accent-soft px-2.5 py-2 text-xs text-accent mb-2.5">
            <Pin className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Pinned: ship date moved to Friday</span>
          </div>
          <div className="space-y-2 text-xs">
            <p className="text-content">
              <span className="font-semibold">Sam</span>
              <span className="text-content-secondary"> pushed the fix, tagged </span>
              <span className="inline-block px-1.5 py-0.5 rounded border border-stroke text-content-muted font-mono text-[10px] align-middle">
                #12
              </span>
            </p>
            <p className="text-content">
              <span className="font-semibold">Priya</span>
              <span className="text-content-secondary"> approved — nice work.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-2xl border border-stroke bg-surface shadow-xl overflow-hidden p-5">
      <div className="flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent mb-3">
        <Pin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Pinned as decision: ship date moved to Friday</span>
      </div>
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <span className="w-7 h-7 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center shrink-0">
            SK
          </span>
          <div className="text-sm">
            <p>
              <span className="font-semibold text-content">Sam</span>
              <span className="text-content-secondary"> — pushed the fix, tagged </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-stroke bg-surface-secondary text-content font-mono text-xs align-middle">
                #12 Fix onboarding empty state
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="w-7 h-7 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center shrink-0">
            PS
          </span>
          <div className="text-sm">
            <p>
              <span className="font-semibold text-content">Priya</span>
              <span className="text-content-secondary"> — approved, nice work.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilesMockup() {
  const files = [
    { name: "onboarding-flow-v2.fig", from: "#12 Fix onboarding empty state", kind: "chat" },
    { name: "brand-guidelines.pdf", from: "Group chat", kind: "chat" },
    { name: "call-recording-jun24.m4a", from: "#9 Kickoff call notes", kind: "task" },
  ];
  return (
    <div className="rounded-2xl border border-stroke bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 h-11 border-b border-stroke">
        <FileText className="w-4 h-4 text-content-muted" />
        <span className="text-sm font-semibold text-content">All Files</span>
      </div>
      <div className="divide-y divide-stroke-secondary">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-content-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-content truncate">{f.name}</p>
              <p className="text-xs text-content-muted truncate">from {f.from}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PROBLEMS = [
  {
    icon: MessagesSquare,
    title: "Scattered across tools",
    body: "A tracker for tasks, a group chat for decisions, a Doc for notes, a Drive folder for files. None of them agree with each other.",
  },
  {
    icon: UserCheck,
    title: "No one owns approval",
    body: "Work gets marked “done” in a group chat, and three people find out three different ways — if they find out at all.",
  },
  {
    icon: FolderX,
    title: "Files get lost in DMs",
    body: "The file you need is in a thread from six weeks ago, if you can even remember who sent it.",
  },
];

const GRID_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Role-aware dashboards",
    body: "Workers see what's next and what needs revision. Managers see what's blocked, overdue, and awaiting approval. Same project, different glance.",
  },
  {
    icon: Sparkles,
    title: "An AI assistant that knows its place — coming soon",
    body: "Read-only Q&A over your real project data, plus manager-only task drafts that need a human to confirm. It will never auto-create.",
  },
  {
    icon: Video,
    title: "Meetings, logged where the work happens",
    body: "Log a meeting with your own call link, notes, and time — tied back to a task, searchable in the activity feed.",
  },
  {
    icon: Bell,
    title: "Notifications that reach you",
    body: "In-app, push, and email, with PWA support — so push works without a native app.",
  },
  {
    icon: Search,
    title: "Search that respects access",
    body: "One search across tasks, chat, and files — scoped to what you can already see, nothing more.",
  },
  {
    icon: Activity,
    title: "An activity log underneath it all",
    body: "Every approval, pin, and invite recorded automatically, so nobody has to ask “wait, what happened here?”",
  },
];

const STEPS = [
  {
    icon: FolderPlus,
    title: "Create a project",
    body: "It's the only top-level thing you make. People, tasks, chat, notes, and files all live inside it.",
  },
  {
    icon: UserPlus,
    title: "Invite by email",
    body: "No account yet? Accepting the invite creates one automatically — no gate, no setup wizard before they can start working.",
  },
  {
    icon: Zap,
    title: "Work happens here",
    body: "Assign tasks, chat about them, attach files, and approve — all without leaving the project.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative bg-nav-bg overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 border border-white/15 rounded-full px-3 py-1 mb-6">
              For contract, freelance &amp; lean teams
            </span>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight leading-[1.1] mb-5">
              One project-shaped home for how freelance teams actually work
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
              Tasks, chat, notes, files, and approvals, together in one project.
              Clance replaces the PM tool, the WhatsApp group, the shared Doc, and
              the Slack workspace you&apos;ve stitched together to make it work.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 border border-white/15 hover:bg-white/10 text-white font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="text-sm text-white/40 mt-4">
              Set up your first project in under a minute.
            </p>
          </div>

          <div className="mt-14 sm:mt-16">
            <TaskMockup />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-surface-secondary border-b border-stroke">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <div className="max-w-2xl mb-12">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3 mb-4">
              Your project already has five owners
            </h2>
            <p className="text-content-secondary text-lg leading-relaxed">
              Tasks live in one app. Approvals happen over text. Files get buried
              three DMs deep. By the time the work is done, nobody agrees on what
              actually happened.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEMS.map((p) => (
              <div
                key={p.title}
                className="bg-surface border border-stroke rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-danger" />
                </div>
                <h3 className="font-semibold text-content mb-1.5">{p.title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature: Tasks */}
      <section id="features" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="min-w-0">
            <Eyebrow>Tasks &amp; approvals</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3 mb-5">
              A task system built for real accountability
            </h2>
            <ul className="space-y-4">
              {[
                "Unlimited nested subtasks — no separate “milestone” object to maintain",
                "Multiple assignees per task; anyone assigned can submit it",
                "Any manager can approve — first approval stands, no waiting on a hierarchy",
                "Rejected work bounces back to in-progress with a comment, not a vague DM",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-content-secondary leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-2xl border border-stroke bg-surface-secondary/50 p-6">
            <div className="rounded-xl border border-stroke bg-surface p-5 shadow-lg">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-4">
                {[
                  { label: "Unassigned", cls: "bg-surface-active text-content-muted" },
                  { label: "Pending", cls: "bg-info-soft text-info" },
                  { label: "Submitted", cls: "bg-warning-soft text-warning" },
                  { label: "Approved", cls: "bg-success-soft text-success" },
                ].map((s, i, arr) => (
                  <span key={s.label} className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ${s.cls}`}>
                      {s.label}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-content-muted shrink-0" />
                    )}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 pl-4 py-1.5 text-sm min-w-0">
                  <Layers className="w-3.5 h-3.5 text-content-muted shrink-0" />
                  <span className="text-content-muted font-mono text-xs shrink-0">#14</span>
                  <span className="text-content truncate">Wire up push notifications</span>
                </div>
                <div className="flex items-center gap-2.5 pl-9 py-1.5 text-sm min-w-0">
                  <span className="text-content-muted font-mono text-xs shrink-0">#14.1</span>
                  <span className="text-content-secondary truncate">Register device tokens</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto shrink-0" />
                </div>
                <div className="flex items-center gap-2.5 pl-9 py-1.5 text-sm min-w-0">
                  <span className="text-content-muted font-mono text-xs shrink-0">#14.2</span>
                  <span className="text-content-secondary truncate">Handle notification taps</span>
                  <AlertCircle className="w-3.5 h-3.5 text-warning ml-auto shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature: Chat */}
      <section className="bg-surface-secondary border-y border-stroke">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="min-w-0 order-2 lg:order-1">
            <ChatMockup />
          </div>
          <div className="min-w-0 order-1 lg:order-2">
            <Eyebrow>Chat</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3 mb-5">
              One messaging engine for group chat, DMs, and task comments
            </h2>
            <ul className="space-y-4">
              {[
                "Threads, replies, reactions, and @mentions that actually notify",
                "Tag a task in a message and it renders as a live preview, not plain text",
                "Pin any message as a decision — it's logged, not lost in scroll",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-content-secondary leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature: Files */}
      <section>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="min-w-0">
            <Eyebrow>Files</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3 mb-5">
              Files don&apos;t need their own app
            </h2>
            <ul className="space-y-4">
              {[
                "No separate upload flow, no permission matrix — attachments live on the task or chat they belong to",
                "Visibility inherits automatically from who's already in that thread",
                "“All Files” pulls every attachment you personally have access to onto one screen",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-content-secondary leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <FilesMockup />
          </div>
        </div>
      </section>

      {/* Grid features */}
      <section className="bg-surface-secondary border-y border-stroke">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <div className="max-w-2xl mb-12">
            <Eyebrow>And the rest</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3">
              Everything else your project needs
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GRID_FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-surface border border-stroke rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-content mb-1.5">{f.title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <div className="max-w-2xl mb-14">
            <Eyebrow>Getting started</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-content tracking-tight mt-3">
              Up and running in three steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-content-muted font-mono text-sm">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-content text-lg mb-1.5">
                  {s.title}
                </h3>
                <p className="text-content-secondary leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-nav-bg">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
            Give your project one home, instead of five apps
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Free to get started. Set up your first project in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-5 py-3 rounded-lg transition-colors"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/15 hover:bg-white/10 text-white font-medium px-5 py-3 rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 pb-8">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-content font-semibold text-lg tracking-tight">
                  Clance
                </span>
              </Link>
              <p className="text-sm text-content-secondary leading-relaxed">
                One project-shaped home for contract, freelance, and lean team
                work.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-3">
                  Product
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <a href="#features" className="text-content-secondary hover:text-content transition-colors">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-content-secondary hover:text-content transition-colors">
                    How it works
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-3">
                  Account
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <Link href="/login" className="text-content-secondary hover:text-content transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="text-content-secondary hover:text-content transition-colors">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-stroke-secondary">
            <p className="text-sm text-content-muted">&copy; 2026 Clance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
