import { pgEnum, pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const activity_type = pgEnum('activity_type', [
  'task_created',
  'task_status_changed',
  'task_assigned',
  'task_deleted',
  'note_pinned',
  'note_unpinned',
  'file_uploaded',
  'meeting_created',
  'message_pinned',
  'member_invited',
  'member_joined',
  'member_removed',
  'member_role_changed',
  'project_updated',
]);

export const activity_log = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  actor_id: uuid('actor_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  type: activity_type('type').notNull(),
  summary: varchar('summary', { length: 500 }).notNull(),
  body: text('body'),
  link: varchar('link', { length: 500 }),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
