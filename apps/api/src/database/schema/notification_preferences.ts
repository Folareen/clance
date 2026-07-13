import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notification_preferences = pgTable('notification_preferences', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: boolean('email').notNull().default(true),
  mentions: boolean('mentions').notNull().default(true),
  task_updates: boolean('task_updates').notNull().default(true),
  approvals: boolean('approvals').notNull().default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
