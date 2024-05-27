import {
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { treatmentTable } from '../treatment.table';
import { medicamentTable } from 'src/medicament/medicament.table';
import { sql } from 'drizzle-orm';

export const treatmentMedicamentTable = pgTable(
  'treatments_medicaments',
  {
    id: serial('id').primaryKey(),
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
    takingSchedulesStartingTimestamp: timestamp(
      'taking_schedule_starting_timestamp',
    ).notNull(),
    takingSchedulesEndingTimestamp: timestamp(
      'taking_schedule_ending_timestamp',
    ).default(sql`NULL`),
    deletedAt: timestamp('deleted_at').default(sql`NULL`),
  },
  (treatmentMedicamentTable) => {
    return {
      natural_primary_key: unique('treatment_medicament_natural_primary_key')
        .on(
          treatmentMedicamentTable.treatmentId,
          treatmentMedicamentTable.medicamentId,
          treatmentMedicamentTable.deletedAt,
        )
        .nullsNotDistinct(),
    };
  },
);
