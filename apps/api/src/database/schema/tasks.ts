import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const task_status = pgEnum('task_status', [
  'backlog',
  'in_progress',
  'submitted',
  'approved',
]);

export const task_priority = pgEnum('task_priority', [
  'urgent',
  'high',
  'medium',
  'low',
  'none',
]);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  parent_id: uuid('parent_id'),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: task_status('status').notNull().default('backlog'),
  priority: task_priority('priority').notNull().default('none'),
  due_date: timestamp('due_date', { withTimezone: true }),
  task_number: integer('task_number').notNull(),
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
