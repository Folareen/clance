import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { notifications, users, projects, notification_preferences } from '../database/schema';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { UpdatePreferencesDto } from './dto';

type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_commented'
  | 'project_invited'
  | 'member_joined'
  | 'dm_received'
  | 'meeting_created'
  | 'mentioned'
  | 'message_pinned';

// Maps each notification type to the preference category that gates its
// email/push delivery. In-app notification rows (the bell icon) are always
// created regardless of preferences — these only control outbound channels.
// There's no distinct "approval requested" notification type today (it's
// folded into task_status_changed alongside routine updates), so `approvals`
// isn't separately addressable here yet — it's stored for forward
// compatibility once that distinction exists at the call site.
const CATEGORY_BY_TYPE: Record<NotificationType, 'mentions' | 'task_updates' | null> = {
  mentioned: 'mentions',
  dm_received: 'mentions',
  task_assigned: 'task_updates',
  task_status_changed: 'task_updates',
  task_commented: 'task_updates',
  meeting_created: 'task_updates',
  message_pinned: 'task_updates',
  project_invited: null,
  member_joined: null,
};

const DEFAULT_PREFERENCES = {
  email: true,
  mentions: true,
  task_updates: true,
  approvals: true,
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private email: EmailService,
    private push: PushService,
  ) {}

  /** Callers use this fire-and-forget, so failures are caught and logged here instead of becoming unhandled rejections. */
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

    try {
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

      if (await this.isCategoryEnabled(params.user_id, params.type)) {
        this.sendEmail(params.user_id, params.title, params.body, params.link);
        this.sendPush(params.user_id, params.title, params.body, params.link);
      }

      return notification;
    } catch (err) {
      this.logger.warn(`Failed to create notification for user ${params.user_id}: ${err}`);
      return undefined;
    }
  }

  /** Same fire-and-forget contract as create(). */
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

    try {
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
    } catch (err) {
      this.logger.warn(`Failed to create notifications for ${filtered.length} users: ${err}`);
      return;
    }

    for (const userId of filtered) {
      if (await this.isCategoryEnabled(userId, params.type)) {
        this.sendEmail(userId, params.title, params.body, params.link);
        this.sendPush(userId, params.title, params.body, params.link);
      }
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

  async getPreferences(user_id: string) {
    const [row] = await this.db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, user_id))
      .limit(1);

    if (!row) return { user_id, ...DEFAULT_PREFERENCES };
    return row;
  }

  async updatePreferences(user_id: string, dto: UpdatePreferencesDto) {
    const [updated] = await this.db
      .insert(notification_preferences)
      .values({ user_id, ...DEFAULT_PREFERENCES, ...dto })
      .onConflictDoUpdate({
        target: notification_preferences.user_id,
        set: { ...dto, updated_at: new Date() },
      })
      .returning();

    return updated;
  }

  private async isCategoryEnabled(user_id: string, type: NotificationType): Promise<boolean> {
    const category = CATEGORY_BY_TYPE[type];
    if (!category) return true;

    const prefs = await this.getPreferences(user_id);
    return prefs[category];
  }

  private async sendEmail(userId: string, title: string, body?: string, link?: string) {
    try {
      const prefs = await this.getPreferences(userId);
      if (!prefs.email) return;

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

  private async sendPush(userId: string, title: string, body?: string, link?: string) {
    try {
      await this.push.sendToUser(userId, { title, body, link });
    } catch (err) {
      this.logger.warn(`Failed to send push notification to user ${userId}: ${err}`);
    }
  }
}
