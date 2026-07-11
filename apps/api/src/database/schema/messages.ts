import { pgTable, uuid, text, boolean, timestamp, AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from './users';
import { channels } from './channels';

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channel_id: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  sender_id: uuid('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parent_message_id: uuid('parent_message_id').references(
    (): AnyPgColumn => messages.id,
    { onDelete: 'cascade' },
  ),
  pinned: boolean('pinned').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
