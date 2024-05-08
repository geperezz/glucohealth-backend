import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const patientTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  email: text('email').unique().notNull(),
  phoneNumber: text('phone_number'),
  nationalId: text('national_id').unique().notNull(),
  age: integer('age'),
  weightInKg: integer('weight_in_kg'),
  heightInCm: integer('height_in_cm'),
  password: text('password').notNull(),
});
