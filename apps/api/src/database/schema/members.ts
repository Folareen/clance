import { pgEnum, pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const member_role = pgEnum('member_role', ['manager', 'worker']);
export const member_status = pgEnum('member_status', ['pending', 'active']);

export const members = pgTable(
  'members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: member_role('role').notNull().default('worker'),
    label: varchar('label', { length: 100 }),
    status: member_status('status').notNull().default('pending'),
    invite_token: varchar('invite_token', { length: 255 }).unique(),
    invited_by: uuid('invited_by')
      .notNull()
      .references(() => users.id),
    joined_at: timestamp('joined_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('unique_project_member').on(table.project_id, table.user_id),
  ],
);
