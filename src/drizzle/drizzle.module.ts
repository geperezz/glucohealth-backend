import { Module, OnModuleInit, forwardRef } from '@nestjs/common';

import { drizzleClient } from './drizzle.client';
import { applyMigrations } from './drizzle.migrator';
import { UserModule } from 'src/user/user.module';
import { DrizzleSeeder } from './drizzle.seeder';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      useValue: drizzleClient,
    },
    DrizzleSeeder,
  ],
  exports: ['DRIZZLE_CLIENT'],
})
export class DrizzleModule implements OnModuleInit {
  constructor(private readonly drizzleSeeder: DrizzleSeeder) {}

  async onModuleInit(): Promise<void> {
    await applyMigrations();
    await this.drizzleSeeder.seed();
  }
}
