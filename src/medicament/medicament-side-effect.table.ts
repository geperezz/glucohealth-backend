import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { medicamentTable } from './medicament.table';

export const medicamentSideEffectTable = pgTable(
  'medicaments_side_effects',
  {
    medicamentId: integer('medicament_id')
      .references(() => medicamentTable.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      })
      .notNull(),
    sideEffect: text('side_effect').notNull(),
  },
  (medicamentPresentationTable) => {
    return {
      primaryKey: primaryKey({
        columns: [
          medicamentPresentationTable.medicamentId,
          medicamentPresentationTable.sideEffect,
        ],
      }),
    };
  },
);
