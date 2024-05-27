import { Inject, Injectable } from '@nestjs/common';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { DrizzleClient } from './drizzle.client';

@Injectable()
export class DrizzleMigrator {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async applyMigrations(): Promise<void> {
    await migrate(this.drizzleClient, { migrationsFolder: 'drizzle' });
  }
}
