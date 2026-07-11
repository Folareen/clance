import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { messages } from './messages';

export const message_reactions = pgTable(
  'message_reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    message_id: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 16 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('unique_message_reaction').on(table.message_id, table.user_id, table.emoji),
  ],
);
