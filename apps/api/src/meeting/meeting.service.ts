import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { meetings, members, users, tasks } from '../database/schema';
import { CreateMeetingDto, UpdateMeetingDto } from './dto';
import { NotificationService } from '../notification/notification.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class MeetingService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private notifications: NotificationService,
    private activity: ActivityService,
  ) {}

  async create(project_id: string, dto: CreateMeetingDto, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    if (dto.task_id) {
      const [task] = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, dto.task_id), eq(tasks.project_id, project_id)))
        .limit(1);
      if (!task) throw new NotFoundException('Task not found');
    }

    const [meeting] = await this.db
      .insert(meetings)
      .values({
        project_id,
        task_id: dto.task_id,
        title: dto.title,
        join_url: dto.join_url,
        notes: dto.notes,
        happened_at: dto.happened_at ? new Date(dto.happened_at) : undefined,
        created_by: user_id,
      })
      .returning();

    const projectMembers = await this.db
      .select({ user_id: members.user_id })
      .from(members)
      .where(and(eq(members.project_id, project_id), eq(members.status, 'active')));

    const creatorName = await this.getUserDisplayName(user_id);
    this.notifications.createMany(
      projectMembers.map((m) => m.user_id).filter((id): id is string => !!id),
      {
        type: 'meeting_created',
        title: `${creatorName} logged a meeting: "${dto.title}"`,
        project_id,
        link: `/app/projects/${project_id}/meetings`,
        actor_id: user_id,
      },
    );

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'meeting_created',
      summary: `logged a meeting: "${dto.title}"`,
      link: `/app/projects/${project_id}/meetings`,
    });

    return this.enrich(meeting);
  }

  async findAll(project_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const rows = await this.db
      .select()
      .from(meetings)
      .where(eq(meetings.project_id, project_id))
      .orderBy(desc(meetings.created_at));

    return Promise.all(rows.map((m) => this.enrich(m)));
  }

  async update(project_id: string, meeting_id: string, dto: UpdateMeetingDto, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);

    const [existing] = await this.db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meeting_id), eq(meetings.project_id, project_id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Meeting not found');

    if (member.role !== 'manager' && existing.created_by !== user_id) {
      throw new ForbiddenException(
        'Only the meeting creator or a manager can edit this meeting',
      );
    }

    if (dto.task_id) {
      const [task] = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, dto.task_id), eq(tasks.project_id, project_id)))
        .limit(1);
      if (!task) throw new NotFoundException('Task not found');
    }

    if (
      dto.title === undefined &&
      dto.task_id === undefined &&
      dto.join_url === undefined &&
      dto.notes === undefined &&
      dto.happened_at === undefined
    ) {
      return this.enrich(existing);
    }

    const set: Record<string, any> = {};
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.task_id !== undefined) set.task_id = dto.task_id;
    if (dto.join_url !== undefined) set.join_url = dto.join_url;
    if (dto.notes !== undefined) set.notes = dto.notes;
    if (dto.happened_at !== undefined) set.happened_at = new Date(dto.happened_at);

    const [updated] = await this.db
      .update(meetings)
      .set(set)
      .where(eq(meetings.id, meeting_id))
      .returning();

    return this.enrich(updated);
  }

  async remove(project_id: string, meeting_id: string, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);

    const [meeting] = await this.db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meeting_id), eq(meetings.project_id, project_id)))
      .limit(1);

    if (!meeting) throw new NotFoundException('Meeting not found');

    if (member.role !== 'manager' && meeting.created_by !== user_id) {
      throw new ForbiddenException(
        'Only the meeting creator or a manager can delete this meeting',
      );
    }

    await this.db.delete(meetings).where(eq(meetings.id, meeting_id));
  }

  private async enrich(meeting: typeof meetings.$inferSelect) {
    const [creator] = await this.db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, meeting.created_by))
      .limit(1);

    let task_title: string | null = null;
    let task_number: number | null = null;
    if (meeting.task_id) {
      const [task] = await this.db
        .select({ title: tasks.title, task_number: tasks.task_number })
        .from(tasks)
        .where(eq(tasks.id, meeting.task_id))
        .limit(1);
      task_title = task?.title ?? null;
      task_number = task?.task_number ?? null;
    }

    return {
      ...meeting,
      creator: {
        id: meeting.created_by,
        first_name: creator?.first_name ?? null,
        last_name: creator?.last_name ?? null,
        email: creator?.email ?? null,
      },
      task_title,
      task_number,
    };
  }

  private async getUserDisplayName(user_id: string) {
    const [user] = await this.db
      .select({ first_name: users.first_name, last_name: users.last_name, email: users.email })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);
    if (!user) return 'Someone';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.email;
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
