import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

import { userTable } from 'src/user/user.table';

export const patientTable = pgTable('patients', {
  id: integer('id')
    .primaryKey()
    .references(() => userTable.id),
  birthdate: timestamp('birthdate'),
  weightInKg: integer('weight_in_kg'),
  heightInCm: integer('height_in_cm'),
});
