import { pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'nurse', 'patient']);

export const userTable = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  email: text('email').unique().notNull(),
  phoneNumber: text('phone_number'),
  nationalId: text('national_id').unique().notNull(),
  password: text('password').notNull(),
  role: userRole('role').notNull(),
});
