import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { tasks } from './tasks';

export const meetings = pgTable('meetings', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  task_id: uuid('task_id').references(() => tasks.id, {
    onDelete: 'set null',
  }),
  title: varchar('title', { length: 255 }).notNull(),
  join_url: varchar('join_url', { length: 500 }),
  notes: varchar('notes', { length: 5000 }),
  happened_at: timestamp('happened_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
