import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const puzzles = pgTable('puzzles', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  cols: integer('cols').notNull(),
  rows: integer('rows').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
