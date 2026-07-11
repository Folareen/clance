import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';
import { DRIZZLE, DrizzleDB } from '../database';
import { push_subscriptions } from '../database/schema';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private config: ConfigService,
  ) {
    webpush.setVapidDetails(
      this.config.getOrThrow<string>('VAPID_SUBJECT'),
      this.config.getOrThrow<string>('VAPID_PUBLIC_KEY'),
      this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
    );
  }

  async subscribe(
    user_id: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    await this.db
      .insert(push_subscriptions)
      .values({
        user_id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .onConflictDoUpdate({
        target: push_subscriptions.endpoint,
        set: { user_id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      });
  }

  async unsubscribe(endpoint: string) {
    await this.db.delete(push_subscriptions).where(eq(push_subscriptions.endpoint, endpoint));
  }

  async sendToUser(user_id: string, payload: { title: string; body?: string; link?: string }) {
    const subs = await this.db
      .select()
      .from(push_subscriptions)
      .where(eq(push_subscriptions.user_id, user_id));

    if (subs.length === 0) return;

    const data = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            data,
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await this.db
              .delete(push_subscriptions)
              .where(eq(push_subscriptions.endpoint, sub.endpoint));
          } else {
            this.logger.warn(`Push send failed for user ${user_id}: ${err?.message ?? err}`);
          }
        }
      }),
    );
  }
}
