import { Module, OnModuleInit } from '@nestjs/common';

import { drizzleClient } from './drizzle.client';
import { applyMigrations } from './drizzle.migrator';

@Module({
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      useValue: drizzleClient,
    },
  ],
  exports: ['DRIZZLE_CLIENT'],
})
export class DrizzleModule implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await applyMigrations();
  }
}
