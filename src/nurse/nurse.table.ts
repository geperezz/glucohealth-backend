import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const nurseTable = pgTable('nurses', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  phoneNumber: text('phone_number').notNull(),
  nationalId: text('national_id').unique().notNull(),
  password: text('password').notNull(),
});
