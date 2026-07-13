import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { activity_log, members, users } from '../database/schema';

type ActivityType =
  | 'task_created'
  | 'task_status_changed'
  | 'task_assigned'
  | 'task_deleted'
  | 'note_pinned'
  | 'note_unpinned'
  | 'file_uploaded'
  | 'meeting_created'
  | 'message_pinned'
  | 'member_invited'
  | 'member_joined'
  | 'member_removed'
  | 'member_role_changed'
  | 'project_updated';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  /**
   * Callers intentionally fire-and-forget this (activity logging is a
   * secondary side-effect that shouldn't fail the main request), so errors
   * are caught and logged here rather than left as an unhandled rejection.
   */
  async log(params: {
    project_id: string;
    actor_id?: string;
    type: ActivityType;
    summary: string;
    body?: string;
    link?: string;
  }) {
    try {
      await this.db.insert(activity_log).values({
        project_id: params.project_id,
        actor_id: params.actor_id,
        type: params.type,
        summary: params.summary,
        body: params.body,
        link: params.link,
      });
    } catch (err) {
      this.logger.warn(`Failed to log activity for project ${params.project_id}: ${err}`);
    }
  }

  async list(project_id: string, user_id: string, limit = 50, offset = 0) {
    await this.requireActiveMember(project_id, user_id);

    const rows = await this.db
      .select({
        activity: activity_log,
        actor_first_name: users.first_name,
        actor_last_name: users.last_name,
        actor_email: users.email,
      })
      .from(activity_log)
      .leftJoin(users, eq(users.id, activity_log.actor_id))
      .where(eq(activity_log.project_id, project_id))
      .orderBy(desc(activity_log.created_at))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      ...r.activity,
      actor: r.activity.actor_id
        ? {
            id: r.activity.actor_id,
            first_name: r.actor_first_name,
            last_name: r.actor_last_name,
            email: r.actor_email,
          }
        : null,
    }));
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
  }
}
