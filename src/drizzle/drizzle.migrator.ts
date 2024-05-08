import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { drizzleClient } from './drizzle.client';

export async function applyMigrations(): Promise<void> {
  await migrate(drizzleClient, { migrationsFolder: 'drizzle' });
}
