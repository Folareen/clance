import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { meetings, members, users, tasks } from '../database/schema';
import { CreateMeetingDto } from './dto';
import { NotificationService } from '../notification/notification.service';
import { ActivityService } from '../activity/activity.service';

const CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

function randomMeetCode() {
  const segment = (len: number) =>
    Array.from(randomBytes(len))
      .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

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

    const join_url = `https://meet.google.com/${randomMeetCode()}`;

    const [meeting] = await this.db
      .insert(meetings)
      .values({
        project_id,
        task_id: dto.task_id,
        title: dto.title,
        join_url,
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
        title: `${creatorName} started a meeting: "${dto.title}"`,
        project_id,
        link: `/app/projects/${project_id}/meetings`,
        actor_id: user_id,
      },
    );

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'meeting_created',
      summary: `started a meeting: "${dto.title}"`,
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
