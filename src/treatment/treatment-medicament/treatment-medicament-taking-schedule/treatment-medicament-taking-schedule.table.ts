import { integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';
import { treatmentMedicamentTable } from '../treatment-medicament.table';

export const treatmentMedicamentTakingScheduleTable = pgTable(
  'treatments_medicaments_taking_schedules',
  {
    id: serial('id').primaryKey(),
    treatmentMedicamentId: integer('treatment_medicament_id')
      .references(() => treatmentMedicamentTable.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    takingSchedule: text('taking_schedule').notNull(),
  },
  (treatmentMedicamentTakingScheduleTable) => {
    return {
      naturalPrimaryKey: unique(
        'treatment_medicament_taking_schedule_natural_primary_key',
      ).on(
        treatmentMedicamentTakingScheduleTable.treatmentMedicamentId,
        treatmentMedicamentTakingScheduleTable.takingSchedule,
      ),
    };
  },
);
