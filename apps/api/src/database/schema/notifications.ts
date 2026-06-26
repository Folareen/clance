import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const notification_type = pgEnum('notification_type', [
  'task_assigned',
  'task_status_changed',
  'task_commented',
  'project_invited',
  'member_joined',
  'dm_received',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notification_type('type').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  body: text('body'),
  project_id: uuid('project_id').references(() => projects.id, {
    onDelete: 'cascade',
  }),
  link: varchar('link', { length: 500 }),
  read: boolean('read').notNull().default(false),
  actor_id: uuid('actor_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
