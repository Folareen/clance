import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { members } from './members';

export const task_assignees = pgTable(
  'task_assignees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    task_id: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    member_id: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    assigned_at: timestamp('assigned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_task_assignee').on(table.task_id, table.member_id),
  ],
);
