import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const puzzles = pgTable('puzzles', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  cols: integer('cols').notNull(),
  rows: integer('rows').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
