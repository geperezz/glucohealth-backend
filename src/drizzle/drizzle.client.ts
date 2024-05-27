import { drizzle } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

export function buildDrizzleClient(databaseUrl: string) {
  const dbConnPool = new Pool({
    connectionString: databaseUrl,
  });
  return drizzle(dbConnPool);
}

export type DrizzleClient = ReturnType<typeof buildDrizzleClient>;
export type DrizzleTransaction = PgTransaction<any, any, any>;
