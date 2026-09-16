import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { members } from '../database/schema';
import { TaskService } from '../task/task.service';
import { LlmProviderService } from './llm-provider.service';

type TaskRow = Awaited<ReturnType<TaskService['findAll']>>[number];
type MemberRow = { id: string; email: string; role: string };

interface DraftTaskResult {
  title: string;
  description: string | null;
  suggested_assignee_member_id: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  parent_id: string | null;
}

const VALID_PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'];

@Injectable()
export class AiService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private taskService: TaskService,
    private llm: LlmProviderService,
  ) {}

  async ask(
    project_id: string,
    question: string,
    user_id: string,
  ): Promise<{ answer: string }> {
    // findAll already enforces active-membership, so the visibility scoping
    // required by the spec falls out of reusing it rather than needing a
    // separate check here.
    const tasks = await this.taskService.findAll(project_id, user_id);
    const context = this.buildTaskContext(tasks);
    const prompt = this.buildAskPrompt(context, question);
    const answer = await this.llm.complete(prompt, { json: false });
    return { answer: answer.trim() };
  }

  async draftTask(
    project_id: string,
    description: string,
    user_id: string,
  ): Promise<DraftTaskResult> {
    await this.requireManager(project_id, user_id);

    const tasks = await this.taskService.findAll(project_id, user_id);
    const activeMembers = await this.db
      .select({ id: members.id, email: members.email, role: members.role })
      .from(members)
      .where(and(eq(members.project_id, project_id), eq(members.status, 'active')));

    const taskContext = this.buildTaskContext(tasks);
    const memberContext = this.buildMemberContext(activeMembers);
    const prompt = this.buildDraftPrompt(taskContext, memberContext, description);

    const raw = await this.llm.complete(prompt, { json: true });
    return this.parseDraftResponse(raw, tasks, activeMembers);
  }

  private buildTaskContext(tasks: TaskRow[]): string {
    if (tasks.length === 0) return '(no tasks in this project yet)';

    const byId = new Map(tasks.map((t) => [t.id, t]));

    return tasks
      .map((t) => {
        const assignees = t.assignees.length
          ? t.assignees
              .map((a) => (a.first_name ? `${a.first_name} ${a.last_name ?? ''}`.trim() : a.email))
              .join(', ')
          : 'unassigned';
        const due = t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : 'none';
        const parent = t.parent_id ? byId.get(t.parent_id) : undefined;
        const parentLine = parent ? `\n  parent: #${parent.task_number} "${parent.title}"` : '';
        const desc = t.description ? `\n  description: ${t.description.slice(0, 200)}` : '';
        return `task_id=${t.id} #${t.task_number} [${t.status}] "${t.title}" priority=${t.priority} due=${due} assignees=${assignees}${parentLine}${desc}`;
      })
      .join('\n');
  }

  private buildMemberContext(memberRows: MemberRow[]): string {
    if (memberRows.length === 0) return '(no active members)';
    return memberRows
      .map((m) => `member_id=${m.id} email=${m.email} role=${m.role}`)
      .join('\n');
  }

  private buildAskPrompt(context: string, question: string): string {
    return [
      'You are a project assistant. Answer the question using ONLY the task data below.',
      "Do not invent information that isn't present. If the data doesn't answer the question, say so plainly.",
      'Keep the answer concise and conversational.',
      '',
      'Tasks in this project:',
      context,
      '',
      `Question: ${question}`,
    ].join('\n');
  }

  private buildDraftPrompt(
    taskContext: string,
    memberContext: string,
    description: string,
  ): string {
    return [
      'You are a project assistant helping a manager draft a new task from a plain-language description.',
      'Respond with ONLY a JSON object (no markdown, no commentary) matching exactly this shape:',
      '{"title": string, "description": string | null, "suggested_assignee_member_id": string | null, "priority": "urgent" | "high" | "medium" | "low" | "none", "parent_id": string | null}',
      '',
      'Rules:',
      '- "suggested_assignee_member_id" must be one of the member_id values listed below, or null if unclear.',
      '- "parent_id" must be one of the task_id values listed below (only set it if the description clearly references an existing task as its parent), otherwise use null.',
      '- "priority" defaults to "none" unless urgency is clearly implied.',
      '- Keep "title" short and actionable.',
      '',
      'Existing tasks in this project:',
      taskContext,
      '',
      'Active project members:',
      memberContext,
      '',
      `Task description from the manager: ${description}`,
    ].join('\n');
  }

  private parseDraftResponse(
    raw: string,
    tasks: TaskRow[],
    memberRows: MemberRow[],
  ): DraftTaskResult {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException(
        'Assistant returned an unexpected response. Please try rephrasing.',
      );
    }

    if (!parsed?.title || typeof parsed.title !== 'string') {
      throw new BadRequestException(
        'Assistant returned an incomplete draft. Please try again.',
      );
    }

    const priority = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : 'none';

    // Never trust a model-returned id at face value — only accept it if it
    // actually exists in this project's already-fetched data.
    const assigneeId = memberRows.some((m) => m.id === parsed.suggested_assignee_member_id)
      ? parsed.suggested_assignee_member_id
      : null;
    const parentId = tasks.some((t) => t.id === parsed.parent_id) ? parsed.parent_id : null;

    return {
      title: String(parsed.title).slice(0, 500),
      description: parsed.description ? String(parsed.description) : null,
      suggested_assignee_member_id: assigneeId,
      priority,
      parent_id: parentId,
    };
  }

  private async requireManager(project_id: string, user_id: string) {
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
    if (member.role !== 'manager') {
      throw new ForbiddenException('Only managers can draft tasks');
    }
    return member;
  }
}
