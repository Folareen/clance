import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const file_attach_type = pgEnum('file_attach_type', ['task', 'message']);

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  uploaded_by: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  cloudinary_id: varchar('cloudinary_id', { length: 255 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimetype: varchar('mimetype', { length: 100 }),
  size: integer('size'),
  attach_type: file_attach_type('attach_type').notNull(),
  attach_id: uuid('attach_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
