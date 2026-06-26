import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { notifications, users, projects } from '../database/schema';
import { EmailService } from '../email/email.service';

type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_commented'
  | 'project_invited'
  | 'member_joined'
  | 'dm_received';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private email: EmailService,
  ) {}

  async create(params: {
    user_id: string;
    type: NotificationType;
    title: string;
    body?: string;
    project_id?: string;
    link?: string;
    actor_id?: string;
  }) {
    if (params.actor_id && params.actor_id === params.user_id) return;

    const [notification] = await this.db
      .insert(notifications)
      .values({
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        body: params.body,
        project_id: params.project_id,
        link: params.link,
        actor_id: params.actor_id,
      })
      .returning();

    this.sendEmail(params.user_id, params.title, params.body, params.link);

    return notification;
  }

  async createMany(
    userIds: string[],
    params: {
      type: NotificationType;
      title: string;
      body?: string;
      project_id?: string;
      link?: string;
      actor_id?: string;
    },
  ) {
    const filtered = params.actor_id
      ? userIds.filter((id) => id !== params.actor_id)
      : userIds;

    if (filtered.length === 0) return;

    await this.db.insert(notifications).values(
      filtered.map((user_id) => ({
        user_id,
        type: params.type,
        title: params.title,
        body: params.body,
        project_id: params.project_id,
        link: params.link,
        actor_id: params.actor_id,
      })),
    );

    for (const userId of filtered) {
      this.sendEmail(userId, params.title, params.body, params.link);
    }
  }

  async list(user_id: string, limit = 30, offset = 0) {
    const rows = await this.db
      .select({
        notification: notifications,
        actor_first_name: users.first_name,
        actor_last_name: users.last_name,
        actor_email: users.email,
        project_name: projects.name,
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.actor_id))
      .leftJoin(projects, eq(projects.id, notifications.project_id))
      .where(eq(notifications.user_id, user_id))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      ...r.notification,
      actor: r.notification.actor_id
        ? {
            id: r.notification.actor_id,
            first_name: r.actor_first_name,
            last_name: r.actor_last_name,
            email: r.actor_email,
          }
        : null,
      project_name: r.project_name,
    }));
  }

  async unreadCount(user_id: string) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, user_id),
          eq(notifications.read, false),
        ),
      );
    return result.count;
  }

  async markRead(user_id: string, notification_id: string) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notification_id),
          eq(notifications.user_id, user_id),
        ),
      );
  }

  async markAllRead(user_id: string) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.user_id, user_id),
          eq(notifications.read, false),
        ),
      );
  }

  private async sendEmail(userId: string, title: string, body?: string, link?: string) {
    try {
      const [user] = await this.db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.email) {
        await this.email.sendNotificationEmail(user.email, title, body, link);
      }
    } catch (err) {
      this.logger.warn(`Failed to send notification email to user ${userId}: ${err}`);
    }
  }
}
