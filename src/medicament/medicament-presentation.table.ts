import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { medicamentTable } from './medicament.table';

export const medicamentPresentationTable = pgTable(
  'medicaments_presentations',
  {
    medicamentId: integer('medicament_id')
      .references(() => medicamentTable.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    presentation: text('presentation').notNull(),
  },
  (medicamentPresentationTable) => {
    return {
      primaryKey: primaryKey({
        columns: [
          medicamentPresentationTable.medicamentId,
          medicamentPresentationTable.presentation,
        ],
      }),
    };
  },
);
