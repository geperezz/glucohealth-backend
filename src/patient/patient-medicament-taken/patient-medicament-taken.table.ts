import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

import { treatmentTable } from 'src/treatment/treatment.table';
import { patientTable } from '../patient.table';
import { medicamentTable } from 'src/medicament/medicament.table';

export const patientMedicamentTakenTable = pgTable(
  'patients_medicaments_taken',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    treatmentId: integer('treatment_id')
      .notNull()
      .references(() => treatmentTable.id),
    medicamentId: integer('medicament_id')
      .notNull()
      .references(() => medicamentTable.id),
    takingTimestamp: timestamp('taking_timestamp').notNull(),
  },
);
