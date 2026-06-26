import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  projects,
  members,
  tasks,
  task_assignees,
  notes,
  messages,
  channels,
  users,
  files,
} from '../database/schema';
import { AskDto } from './dto';

@Injectable()
export class AssistantService {
  private client: Anthropic;
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey: apiKey || '' });
  }

  async ask(project_id: string, dto: AskDto, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const context = await this.gatherProjectContext(project_id, user_id);
    const systemPrompt = this.buildSystemPrompt(context);

    const conversationMessages: Anthropic.MessageParam[] = [];

    if (dto.history?.length) {
      for (const msg of dto.history) {
        conversationMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    conversationMessages.push({ role: 'user', content: dto.message });

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return { reply: text };
  }

  private async gatherProjectContext(project_id: string, user_id: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, project_id))
      .limit(1);

    const projectMembers = await this.db
      .select({
        email: members.email,
        role: members.role,
        status: members.status,
        label: members.label,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(members)
      .leftJoin(users, eq(users.id, members.user_id))
      .where(eq(members.project_id, project_id));

    const allTasks = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due_date: tasks.due_date,
        task_number: tasks.task_number,
        description: tasks.description,
        created_at: tasks.created_at,
        updated_at: tasks.updated_at,
      })
      .from(tasks)
      .where(eq(tasks.project_id, project_id))
      .orderBy(asc(tasks.task_number));

    const taskIds = allTasks.map((t) => t.id);
    let assigneeMap = new Map<string, string[]>();

    if (taskIds.length > 0) {
      const assignees = await this.db
        .select({
          task_id: task_assignees.task_id,
          email: members.email,
          first_name: users.first_name,
          last_name: users.last_name,
        })
        .from(task_assignees)
        .innerJoin(members, eq(members.id, task_assignees.member_id))
        .leftJoin(users, eq(users.id, members.user_id))
        .where(sql`${task_assignees.task_id} IN ${taskIds}`);

      for (const a of assignees) {
        const name = a.first_name
          ? `${a.first_name} ${a.last_name || ''}`.trim()
          : a.email;
        const list = assigneeMap.get(a.task_id) ?? [];
        list.push(name);
        assigneeMap.set(a.task_id, list);
      }
    }

    const projectNotes = await this.db
      .select({
        title: notes.title,
        pinned: notes.pinned,
        created_at: notes.created_at,
      })
      .from(notes)
      .where(eq(notes.project_id, project_id))
      .orderBy(desc(notes.created_at))
      .limit(20);

    const recentChannels = await this.db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'group'),
        ),
      );

    let recentMessages: { channel_name: string; sender: string; content: string; sent_at: Date }[] = [];

    for (const ch of recentChannels.slice(0, 3)) {
      const msgs = await this.db
        .select({
          content: messages.content,
          sent_at: messages.created_at,
          first_name: users.first_name,
          last_name: users.last_name,
          email: users.email,
        })
        .from(messages)
        .innerJoin(users, eq(users.id, messages.sender_id))
        .where(eq(messages.channel_id, ch.id))
        .orderBy(desc(messages.created_at))
        .limit(10);

      for (const m of msgs) {
        const sender = m.first_name
          ? `${m.first_name} ${m.last_name || ''}`.trim()
          : m.email;
        recentMessages.push({
          channel_name: ch.name || 'general',
          sender,
          content: m.content,
          sent_at: m.sent_at,
        });
      }
    }

    const fileCount = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(files)
      .where(eq(files.project_id, project_id));

    const [currentUser] = await this.db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    return {
      project,
      members: projectMembers,
      tasks: allTasks.map((t) => ({
        ...t,
        assignees: assigneeMap.get(t.id) ?? [],
      })),
      notes: projectNotes,
      recentMessages,
      fileCount: fileCount[0]?.count ?? 0,
      currentUser,
    };
  }

  private buildSystemPrompt(context: Awaited<ReturnType<typeof this.gatherProjectContext>>) {
    const now = new Date().toISOString();
    const userName = context.currentUser.first_name
      ? `${context.currentUser.first_name} ${context.currentUser.last_name || ''}`.trim()
      : context.currentUser.email;

    const taskLines = context.tasks.map((t) => {
      const assignees = t.assignees.length > 0 ? ` [assigned to: ${t.assignees.join(', ')}]` : ' [unassigned]';
      const due = t.due_date ? ` (due: ${new Date(t.due_date).toLocaleDateString()})` : '';
      return `  #${t.task_number}: "${t.title}" — ${t.status}, ${t.priority} priority${due}${assignees}`;
    }).join('\n');

    const memberLines = context.members.map((m) => {
      const name = m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : m.email;
      return `  - ${name} (${m.role}, ${m.status})${m.label ? ` — ${m.label}` : ''}`;
    }).join('\n');

    const noteLines = context.notes.map((n) =>
      `  - "${n.title}"${n.pinned ? ' [pinned]' : ''} (${new Date(n.created_at).toLocaleDateString()})`,
    ).join('\n');

    const chatLines = context.recentMessages
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      .slice(0, 15)
      .map((m) => `  [#${m.channel_name}] ${m.sender}: ${m.content}`)
      .join('\n');

    return `You are an AI assistant for the project "${context.project.name}" in Clance, a project management app.
The current user is ${userName} (${context.currentUser.email}).
Current time: ${now}

PROJECT DESCRIPTION: ${context.project.description || 'No description.'}

TEAM MEMBERS:
${memberLines || '  (none)'}

TASKS (${context.tasks.length} total):
${taskLines || '  (none)'}

NOTES (${context.notes.length} total):
${noteLines || '  (none)'}

RECENT CHAT MESSAGES:
${chatLines || '  (none)'}

FILES: ${context.fileCount} file(s) uploaded.

RULES:
- Answer questions about this project using the data above.
- Be concise and helpful. Use markdown formatting when appropriate.
- If asked about something not in the data, say you don't have that information.
- You are read-only — you cannot modify tasks, send messages, or change anything.
- When referencing tasks, use their task number (e.g. #1, #2).
- When asked "what's overdue", compare due dates with the current time.
- When asked about "my tasks", filter by assignments to ${userName}.`;
  }

  private async requireActiveMember(project_id: string, user_id: string) {
    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.project_id, project_id),
          eq(members.user_id, user_id),
          eq(members.status, 'active'),
        ),
      )
      .limit(1);

    if (!member) throw new ForbiddenException('Not a member of this project');
    return member;
  }
}
