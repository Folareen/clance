import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, sql, desc, asc, ilike } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  tasks,
  task_assignees,
  members,
  users,
} from '../database/schema';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from './dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private notifications: NotificationService,
  ) {}

  async create(project_id: string, dto: CreateTaskDto, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [{ next }] = await this.db
      .select({
        next: sql<number>`coalesce(max(${tasks.task_number}), 0) + 1`,
      })
      .from(tasks)
      .where(eq(tasks.project_id, project_id));

    const [task] = await this.db
      .insert(tasks)
      .values({
        project_id,
        title: dto.title,
        description: dto.description,
        status: (dto.status as any) ?? 'backlog',
        priority: (dto.priority as any) ?? 'none',
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        parent_id: dto.parent_id,
        task_number: next,
        created_by: user_id,
      })
      .returning();

    if (dto.assignee_ids?.length) {
      await this.db.insert(task_assignees).values(
        dto.assignee_ids.map((member_id) => ({
          task_id: task.id,
          member_id,
        })),
      );

      const assigneeUserIds = await this.resolveUserIds(dto.assignee_ids);
      this.notifications.createMany(assigneeUserIds, {
        type: 'task_assigned',
        title: `You were assigned to #${task.task_number} "${task.title}"`,
        project_id,
        link: `/app/projects/${project_id}/tasks`,
        actor_id: user_id,
      });
    }

    return this.findOne(project_id, task.id, user_id);
  }

  async findAll(
    project_id: string,
    user_id: string,
    filters?: { status?: string; priority?: string; search?: string },
  ) {
    await this.requireActiveMember(project_id, user_id);

    const conditions = [eq(tasks.project_id, project_id)];

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status as any));
    }
    if (filters?.priority) {
      conditions.push(eq(tasks.priority, filters.priority as any));
    }
    if (filters?.search) {
      conditions.push(ilike(tasks.title, `%${filters.search}%`));
    }

    const rows = await this.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.task_number));

    const task_ids = rows.map((t) => t.id);
    if (task_ids.length === 0) return [];

    const assignees = await this.db
      .select({
        task_id: task_assignees.task_id,
        member_id: task_assignees.member_id,
        user_id: members.user_id,
        email: members.email,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(task_assignees)
      .innerJoin(members, eq(members.id, task_assignees.member_id))
      .leftJoin(users, eq(users.id, members.user_id))
      .where(
        sql`${task_assignees.task_id} IN ${task_ids}`,
      );

    const assigneeMap = new Map<string, typeof assignees>();
    for (const a of assignees) {
      const list = assigneeMap.get(a.task_id) ?? [];
      list.push(a);
      assigneeMap.set(a.task_id, list);
    }

    return rows.map((t) => ({
      ...t,
      assignees: (assigneeMap.get(t.id) ?? []).map((a) => ({
        member_id: a.member_id,
        user_id: a.user_id,
        email: a.email,
        first_name: a.first_name,
        last_name: a.last_name,
      })),
    }));
  }

  async findOne(project_id: string, task_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task_id), eq(tasks.project_id, project_id)))
      .limit(1);

    if (!task) throw new NotFoundException('Task not found');

    const assignees = await this.db
      .select({
        member_id: task_assignees.member_id,
        user_id: members.user_id,
        email: members.email,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(task_assignees)
      .innerJoin(members, eq(members.id, task_assignees.member_id))
      .leftJoin(users, eq(users.id, members.user_id))
      .where(eq(task_assignees.task_id, task_id));

    const subtasks = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parent_id, task_id), eq(tasks.project_id, project_id)))
      .orderBy(asc(tasks.task_number));

    return {
      ...task,
      assignees: assignees.map((a) => ({
        member_id: a.member_id,
        user_id: a.user_id,
        email: a.email,
        first_name: a.first_name,
        last_name: a.last_name,
      })),
      subtasks,
    };
  }

  async update(
    project_id: string,
    task_id: string,
    dto: UpdateTaskDto,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const [existing] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task_id), eq(tasks.project_id, project_id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Task not found');

    const set: Record<string, any> = { updated_at: new Date() };
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.description !== undefined) set.description = dto.description;
    if (dto.priority !== undefined) set.priority = dto.priority;
    if (dto.due_date !== undefined)
      set.due_date = dto.due_date ? new Date(dto.due_date) : null;
    if (dto.parent_id !== undefined) set.parent_id = dto.parent_id;

    if (dto.status !== undefined) {
      await this.validateStatusTransition(
        existing,
        dto.status,
        project_id,
        user_id,
      );
      set.status = dto.status;
    }

    const [updated] = await this.db
      .update(tasks)
      .set(set)
      .where(eq(tasks.id, task_id))
      .returning();

    if (dto.status !== undefined && dto.status !== existing.status) {
      const assigneeRows = await this.db
        .select({ user_id: members.user_id })
        .from(task_assignees)
        .innerJoin(members, eq(members.id, task_assignees.member_id))
        .where(eq(task_assignees.task_id, task_id));

      const targetIds = [
        existing.created_by,
        ...assigneeRows.map((r) => r.user_id).filter(Boolean),
      ].filter((id): id is string => !!id);

      const label = dto.status.replace('_', ' ');
      this.notifications.createMany([...new Set(targetIds)], {
        type: 'task_status_changed',
        title: `#${existing.task_number} "${existing.title}" moved to ${label}`,
        project_id,
        link: `/app/projects/${project_id}/tasks`,
        actor_id: user_id,
      });
    }

    return updated;
  }

  async remove(project_id: string, task_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task_id), eq(tasks.project_id, project_id)))
      .limit(1);

    if (!task) throw new NotFoundException('Task not found');

    await this.db.delete(tasks).where(eq(tasks.id, task_id));
  }

  async assign(
    project_id: string,
    task_id: string,
    dto: AssignTaskDto,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, task_id), eq(tasks.project_id, project_id)))
      .limit(1);

    if (!task) throw new NotFoundException('Task not found');

    await this.db
      .delete(task_assignees)
      .where(eq(task_assignees.task_id, task_id));

    if (dto.member_ids.length > 0) {
      await this.db.insert(task_assignees).values(
        dto.member_ids.map((member_id) => ({
          task_id,
          member_id,
        })),
      );

      const assigneeUserIds = await this.resolveUserIds(dto.member_ids);
      this.notifications.createMany(assigneeUserIds, {
        type: 'task_assigned',
        title: `You were assigned to #${task.task_number} "${task.title}"`,
        project_id,
        link: `/app/projects/${project_id}/tasks`,
        actor_id: user_id,
      });
    }

    if (task.status === 'backlog' && dto.member_ids.length > 0) {
      await this.db
        .update(tasks)
        .set({ status: 'in_progress', updated_at: new Date() })
        .where(eq(tasks.id, task_id));
    }

    if (dto.member_ids.length === 0) {
      await this.db
        .update(tasks)
        .set({ status: 'backlog', updated_at: new Date() })
        .where(eq(tasks.id, task_id));
    }

    return this.findOne(project_id, task_id, user_id);
  }

  private async validateStatusTransition(
    task: typeof tasks.$inferSelect,
    newStatus: string,
    project_id: string,
    user_id: string,
  ) {
    if (newStatus === 'approved') {
      await this.requireManager(project_id, user_id);

      const unfinished = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.parent_id, task.id),
            sql`${tasks.status} != 'approved'`,
          ),
        )
        .limit(1);

      if (unfinished.length > 0) {
        throw new BadRequestException(
          'Cannot approve: not all subtasks are approved',
        );
      }
    }

    if (task.status === 'approved' && newStatus !== 'approved') {
      await this.requireManager(project_id, user_id);
    }
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

  private async requireManager(project_id: string, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);
    if (member.role !== 'manager') {
      throw new ForbiddenException('Only managers can perform this action');
    }
    return member;
  }

  private async resolveUserIds(memberIds: string[]): Promise<string[]> {
    if (memberIds.length === 0) return [];
    const rows = await this.db
      .select({ user_id: members.user_id })
      .from(members)
      .where(sql`${members.id} IN ${memberIds}`);
    return rows.map((r) => r.user_id).filter((id): id is string => !!id);
  }
}
