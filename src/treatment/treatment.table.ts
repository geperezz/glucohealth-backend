import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

import { patientTable } from 'src/patient/patient.table';

export const treatmentTable = pgTable('treatments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id')
    .references(() => patientTable.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
