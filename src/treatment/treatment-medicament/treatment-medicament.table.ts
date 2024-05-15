import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { treatmentTable } from '../treatment.table';
import { medicamentTable } from 'src/medicament/medicament.table';

export const treatmentMedicamentTable = pgTable(
  'treatment_medicaments',
  {
    treatmentId: integer('treatment_id')
      .references(() => treatmentTable.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    medicamentId: integer('medicament_id')
      .references(() => medicamentTable.id, {
        onUpdate: 'cascade',
        onDelete: 'restrict',
      })
      .notNull(),
    takingSchedule: text('taking_schedule').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (treatmentMedicamentTable) => {
    return {
      primaryKey: primaryKey({
        columns: [
          treatmentMedicamentTable.treatmentId,
          treatmentMedicamentTable.medicamentId,
        ],
      }),
    };
  },
);
