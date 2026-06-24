import { pgEnum, pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const channel_type = pgEnum('channel_type', ['group', 'dm', 'task_comment']);

export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }),
  type: channel_type('type').notNull().default('group'),
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const channel_members = pgTable(
  'channel_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    channel_id: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('unique_channel_member').on(table.channel_id, table.user_id),
  ],
);
