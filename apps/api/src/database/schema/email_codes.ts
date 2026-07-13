import { pgTable, uuid, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const email_codes = pgTable('email_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  code_hash: varchar('code_hash', { length: 255 }).notNull(),
  used: boolean('used').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
