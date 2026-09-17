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
  Video,
  Bell,
  Search,
  Activity,
  FolderPlus,
  UserPlus,
  Zap,
  FileText,
  Lock,
  ShieldCheck,
  Inbox,
  Wand2,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { Reveal } from "@/components/reveal";
import { AssistantDemo } from "@/components/assistant-demo";
import { RoleTabs } from "@/components/role-tabs";
import { Faq } from "@/components/faq";

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
              <span className="text-content-secondary"> approved it, nice work.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-2xl bg-surface shadow-xl overflow-hidden p-5">
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
              <span className="text-content-secondary"> pushed the fix and tagged </span>
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
              <span className="text-content-secondary"> approved it, nice work.</span>
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
    <div className="rounded-2xl bg-surface shadow-xl overflow-hidden">
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

/* Hand-drawn underline. Two offset strokes with slightly different
   curvature read as marker rather than a border-bottom. The stroke
   is drawn on scroll via the same [data-visible] hook Reveal uses. */
function Underline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={`u-draw absolute left-0 -bottom-2 w-full h-[10px] overflow-visible text-accent ${className}`}
    >
      <path
        d="M2 7.5C38 3.2 86 2.4 132 4.1c22 .8 44 2.3 66 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M10 10.4C52 7.6 104 7 150 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/* A word inside a heading that carries the underline. Inside a Reveal the
   stroke draws itself in on scroll; elsewhere it is simply drawn. */
function Marked({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <Underline />
    </span>
  );
}

/* The five things every project produces, and the tool each one drifts into
   when there's no single home for them. Mirrors the objects Clance actually
   holds (tasks, chat, notes, files, approvals) so the right-hand card is a
   one-to-one answer rather than a vague promise. */
const SCATTERED = [
  { icon: CheckCircle2, label: "Tasks", where: "in a tracker" },
  { icon: MessagesSquare, label: "Decisions", where: "in a group chat" },
  { icon: FileText, label: "Notes", where: "in a doc" },
  { icon: FolderX, label: "Files", where: "in someone's DMs" },
  { icon: UserCheck, label: "Approvals", where: "over text" },
];

function ScatterDiagram() {
  return (
    <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-6 items-center">
      {/* Left: five loose objects, each sitting in a different tool. Slight
          alternating offsets on desktop so the column reads as scattered
          rather than as a tidy list. */}
      <ul className="space-y-2.5">
        {SCATTERED.map((item, i) => (
          <li
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-stroke bg-surface px-4 py-3 lg:[margin-left:var(--off)]"
            style={{ ["--off" as string]: `${[0, 28, 10, 36, 4][i]}px` }}
          >
            <item.icon className="w-4 h-4 text-content-muted shrink-0" />
            <span className="text-sm font-medium text-content">{item.label}</span>
            <span className="text-sm text-content-muted truncate">{item.where}</span>
          </li>
        ))}
      </ul>

      {/* Middle: the collapse. Horizontal on desktop, vertical on mobile. */}
      <div className="flex lg:flex-col items-center justify-center gap-2 text-content-muted">
        <span className="h-px w-16 lg:h-16 lg:w-px bg-stroke" />
        <ArrowRight className="w-4 h-4 shrink-0 rotate-90 lg:rotate-0" />
        <span className="h-px w-16 lg:h-16 lg:w-px bg-stroke" />
      </div>

      {/* Right: one project holding all five, with the status flow that makes
          "approved" mean something specific. */}
      <div className="rounded-2xl border border-accent/20 bg-surface shadow-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 h-11 border-b border-stroke bg-accent-soft/40">
          <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-content truncate">
            One project
          </span>
        </div>
        <div className="p-4 space-y-2.5">
          {SCATTERED.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-accent shrink-0" />
              <span className="text-sm text-content">{item.label}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto shrink-0" />
            </div>
          ))}
          <div className="pt-3 mt-1 border-t border-stroke-secondary flex items-center gap-2 flex-wrap">
            <span className="text-content-muted font-mono text-xs">#14</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-warning-soft text-warning">
              Submitted
            </span>
            <ArrowRight className="w-3 h-3 text-content-muted shrink-0" />
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-success-soft text-success">
              Approved
            </span>
            <span className="text-xs text-content-muted">· logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const GRID_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Role-aware dashboards",
    body: "Workers see what's next and what needs revision. Managers see what's blocked, overdue, and awaiting approval. Same project, different glance.",
  },
  {
    icon: Video,
    title: "Meetings, logged where the work happens",
    body: "Log a meeting with your own call link, notes, and time, tied back to a task and searchable in the activity feed.",
  },
  {
    icon: Bell,
    title: "Notifications that reach you",
    body: "In-app, push, and email, with PWA support, so push works without a native app.",
  },
  {
    icon: Search,
    title: "Search that respects access",
    body: "One search across tasks, chat, and files, scoped to what you can already see and nothing more.",
  },
  {
    icon: Activity,
    title: "An activity log underneath it all",
    body: "Every approval, pin, and invite recorded automatically, so nobody has to ask “wait, what happened here?”",
  },
  {
    icon: FileText,
    title: "Notes for the things that aren't tasks",
    body: "A project-scoped scratchpad for context and decisions. Pin the ones that matter so they stay at the top.",
  },
];

const ASSISTANT_POINTS = [
  {
    icon: Inbox,
    title: "Answers from your project, not the internet",
    body: "Ask what's overdue, what's assigned to you, what hasn't been submitted, or what a long thread concluded. It answers from your own tasks and chat.",
  },
  {
    icon: Lock,
    title: "Read-only by default",
    body: "Q&A can look at everything you can already see, and change nothing. It has no power to edit, assign, approve, or delete.",
  },
  {
    icon: Wand2,
    title: "Drafts a task, never creates one",
    body: "Managers can describe work in a sentence and get a structured draft: title, assignee, priority, parent. You review and confirm before it exists.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped to your access",
    body: "It reads exactly what your role can see in that project, and nothing from projects you're not a member of.",
  },
];

const ROLE_VIEWS = {
  worker: {
    label: "Worker",
    blurb: "You see what's yours and what's next, nothing you have to filter.",
    items: [
      "My pending tasks, ordered by due date and priority",
      "Anything bounced back to you for revision",
      "Recent activity on work you're assigned to",
      "Submit or mark done without opening the task",
    ],
  },
  manager: {
    label: "Manager",
    blurb: "You see the shape of the project and where it's stuck.",
    items: [
      "Overall progress, approved against total",
      "Everything awaiting your approval",
      "What's blocked or overdue, and who it's blocked on",
      "Approve, or reject with a comment, in one place",
    ],
  },
};

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. It's free forever, with unlimited projects, tasks and members. There's no trial clock, no seat cap, and no credit card at signup. Every feature on this page is included.",
  },
  {
    q: "Is there a workspace or org layer to set up first?",
    a: "No. A project is the only top-level thing you create, and it holds its own people, tasks, chat, notes, files, and activity log. There's nothing to configure above it.",
  },
  {
    q: "Can someone be a manager on one project and a worker on another?",
    a: "Yes. Roles are scoped per project, so the same person can manage one project and deliver work on another. A project can also have multiple managers, with no hierarchy between them.",
  },
  {
    q: "How do approvals work with more than one manager?",
    a: "Any manager can approve a task, and the first approval stands. A parent task can only be approved once all of its subtasks are approved.",
  },
  {
    q: "What happens to someone's tasks when they're removed?",
    a: "Their assigned tasks fall back to unassigned and stay open for anyone on the project to pick up, so nothing quietly disappears with them.",
  },
  {
    q: "Do invited people need an account first?",
    a: "No. A manager invites by email with a starting role; if there's no account yet, accepting the invite creates one and drops them straight into the project. Profile details can wait.",
  },
  {
    q: "Where do files live?",
    a: "Only as attachments on a task or a chat message. There's no separate upload flow or permission matrix. Visibility is inherited from that task or chat, and All Files aggregates everything you personally have access to.",
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
    body: "No account yet? Accepting the invite creates one automatically, with no gate and no setup wizard before they can start working.",
  },
  {
    icon: Zap,
    title: "Work happens here",
    body: "Assign tasks, chat about them, attach files, and approve, all without leaving the project.",
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
        {/* Accent glow behind the hero copy. Two orbs on offset paths so the
            drift never visibly loops; each wrapper owns the position and the
            child owns the motion, keeping the transform off the layout. */}
        <div
          aria-hidden
          className="absolute -top-20 left-1/4 w-[600px] h-[400px] max-w-full pointer-events-none"
        >
          <div
            className="w-full h-full rounded-full animate-drift-a"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(124,58,237,0.35), transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        <div
          aria-hidden
          className="absolute top-10 left-[45%] w-[460px] h-[340px] max-w-full pointer-events-none"
        >
          <div
            className="w-full h-full rounded-full animate-drift-b"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(99,102,241,0.28), transparent 70%)",
              filter: "blur(90px)",
            }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-[1.1] mb-6 animate-fade-up">
              One project-shaped home for how freelance teams{" "}
              <Marked>actually work</Marked>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg animate-fade-up delay-2">
              Tasks, chat, notes, files and approvals in one project, so nothing
              lives in a place only one person remembers.
            </p>
            <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-4">
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-5 py-3 rounded-lg transition-colors press group"
              >
                Get started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 border border-white/15 hover:bg-white/10 text-white font-medium px-5 py-3 rounded-lg transition-colors press"
              >
                Sign in
              </Link>
            </div>
            <p className="text-sm text-white/40 mt-4 animate-fade-up delay-5">
              Free forever · no credit card required.
            </p>
          </div>

          <div className="mt-14 sm:mt-16 animate-fade-up delay-6">
            <TaskMockup />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-surface-secondary">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content mb-4">
              Your project is spread across{" "}
              <Marked>five tools</Marked>
            </h2>
            <p className="text-content-secondary text-lg leading-relaxed">
              Every project produces the same five things. Without one home for
              them, each drifts into a different app, and by the time the work
              ships nobody agrees on what actually happened.
            </p>
          </Reveal>
          <Reveal delay={90}>
            <ScatterDiagram />
          </Reveal>
        </div>
      </section>

      {/* Feature: Tasks */}
      <section id="features" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal kind="left" className="min-w-0 lg:col-span-5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content mb-5">
              Built for real accountability
            </h2>
            <ul className="space-y-4">
              {[
                "Unlimited nested subtasks, with no separate “milestone” object to maintain",
                "Multiple assignees per task; anyone assigned can submit it",
                "Any manager can approve, and the first approval stands, so nobody waits on a hierarchy",
                "Rejected work bounces back to in-progress with a comment, not a vague DM",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-content-secondary leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal kind="right" delay={120} className="min-w-0 lg:col-span-7 rounded-2xl bg-surface-secondary p-6">
            <div className="rounded-xl bg-surface p-5 shadow-lg">
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
          </Reveal>
        </div>
      </section>

      {/* Feature: Chat */}
      <section className="bg-surface-secondary">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal kind="left" className="min-w-0 order-2 lg:order-1 lg:col-span-7">
            <ChatMockup />
          </Reveal>
          <Reveal kind="right" delay={120} className="min-w-0 order-1 lg:order-2 lg:col-span-5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content mb-5">
              One engine for chat, DMs and task comments
            </h2>
            <ul className="space-y-4">
              {[
                "Threads, replies, reactions, and @mentions that actually notify",
                "Tag a task in a message and it renders as a live preview, not plain text",
                "Pin any message as a decision so it's logged, not lost in scroll",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-content-secondary leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Feature: Files */}
      <section>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14">
            <Reveal kind="left" className="min-w-0 lg:col-span-5">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content">
                Files don&apos;t need their own app
              </h2>
            </Reveal>
            <Reveal
              kind="right"
              delay={100}
              className="min-w-0 lg:col-span-6 lg:col-start-7"
            >
              <ul className="space-y-4">
                {[
                  "No separate upload flow and no permission matrix. Attachments live on the task or chat they belong to",
                  "Visibility inherits automatically from who's already in that thread",
                  "“All Files” pulls every attachment you personally have access to onto one screen",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-content-secondary leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={160} className="min-w-0">
            <FilesMockup />
          </Reveal>
        </div>
      </section>


      {/* Feature: AI Assistant */}
      <section id="assistant" className="scroll-mt-16 bg-surface-secondary">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content mb-4">
              An assistant that knows its place
            </h2>
            <p className="text-content-secondary text-lg leading-relaxed">
              Most tools bolt on an AI that happily invents work and reassigns
              your team. Clance&apos;s reads your project and answers questions,
              and when it drafts a task, a human still has to say yes.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
            <Reveal kind="left">
              <AssistantDemo />
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {ASSISTANT_POINTS.map((point, i) => (
                <Reveal
                  key={point.title}
                  kind="right"
                  delay={i * 90}
                  className="flex items-start gap-3.5"
                >
                  <span className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                    <point.icon className="w-4 h-4 text-accent" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-content mb-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-content-secondary leading-relaxed">
                      {point.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid features */}
      <section>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Sticky rail: the heading stays with the cards as they scroll,
              instead of scrolling away above them. */}
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content">
                Everything else your project needs
              </h2>
            </div>
          </Reveal>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-x-10 gap-y-10">
            {GRID_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 90}>
                <f.icon className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-semibold text-content mb-1.5">{f.title}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {f.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* Role-aware dashboards */}
      <section id="dashboards" className="scroll-mt-16 bg-surface-secondary">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal kind="left" className="min-w-0 lg:col-span-5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content mb-4">
              The same project, seen two ways
            </h2>
            <p className="text-content-secondary text-lg leading-relaxed mb-5">
              A worker opening a project shouldn&apos;t have to dig past twelve
              charts to find the two things they owe someone. A manager
              shouldn&apos;t have to guess who a task is stuck on.
            </p>
            <p className="text-content-secondary leading-relaxed">
              Your role decides the glance view. No dashboard builder, no
              widget library, no setup.
            </p>
          </Reveal>
          <Reveal kind="right" delay={120} className="min-w-0 lg:col-span-7">
            <RoleTabs worker={ROLE_VIEWS.worker} manager={ROLE_VIEWS.manager} />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32">
          <Reveal className="max-w-2xl mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content">
              Up and running in three steps
            </h2>
          </Reveal>
          {/* A rule runs behind the row so the steps read as one sequence
              rather than three unrelated columns. */}
          <div className="relative grid sm:grid-cols-3 gap-10 sm:gap-10">
            <span
              aria-hidden
              className="hidden sm:block absolute left-0 right-0 top-3 h-px bg-stroke"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 110} className="relative">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="relative bg-surface pr-3 text-2xl font-semibold text-accent tabular-nums leading-none">
                    0{i + 1}
                  </span>
                  <s.icon className="w-4 h-4 text-content-muted shrink-0" />
                </div>
                <h3 className="font-semibold text-content text-lg mb-1.5">
                  {s.title}
                </h3>
                <p className="text-content-secondary leading-relaxed">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-surface-secondary">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content">
                Questions worth asking first
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80} className="lg:col-span-8 min-w-0">
            <Faq items={FAQS} />
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-nav-bg">
        <Reveal className="max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl sm:text-5xl font-semibold text-white mb-4 leading-[1.1]">
              Give your project <Marked>one home</Marked>, instead of five apps
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Free forever, with unlimited projects, tasks and members. No
              credit card, no trial clock.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Get started
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
        </Reveal>
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
                  <a href="#assistant" className="text-content-secondary hover:text-content transition-colors">
                    AI assistant
                  </a>
                  <a href="#dashboards" className="text-content-secondary hover:text-content transition-colors">
                    Dashboards
                  </a>
                  <a href="#how-it-works" className="text-content-secondary hover:text-content transition-colors">
                    How it works
                  </a>
                  <a href="#faq" className="text-content-secondary hover:text-content transition-colors">
                    FAQ
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
