import { sql } from 'drizzle-orm';
import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

import { patientTable } from 'src/patient/patient.table';

export const treatmentTable = pgTable('treatments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id')
    .references(() => patientTable.id)
    .notNull(),
  deletedAt: timestamp('deleted_at').default(sql`NULL`),
});
