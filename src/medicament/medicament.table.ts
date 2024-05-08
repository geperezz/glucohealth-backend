import { pgTable, serial, text, unique } from 'drizzle-orm/pg-core';

export const medicamentTable = pgTable(
  'medicaments',
  {
    id: serial('id').primaryKey(),
    tradeName: text('tradeName'),
    genericName: text('genericName').notNull(),
    description: text('description').notNull(),
  },
  (medicamentTable) => {
    return {
      uniqueName: unique()
        .on(medicamentTable.tradeName, medicamentTable.genericName)
        .nullsNotDistinct(),
    };
  },
);
