import { Module, OnModuleInit, forwardRef } from '@nestjs/common';

import { buildDrizzleClient } from './drizzle.client';
import { DrizzleMigrator } from './drizzle.migrator';
import { UserModule } from 'src/user/user.module';
import { DrizzleSeeder } from './drizzle.seeder';
import { Config } from 'src/config/config.loader';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      useFactory: (config: Config) => buildDrizzleClient(config.DATABASE_URL),
      inject: [{ token: 'CONFIG', optional: false }],
    },
    DrizzleMigrator,
    DrizzleSeeder,
  ],
  exports: ['DRIZZLE_CLIENT'],
})
export class DrizzleModule implements OnModuleInit {
  constructor(
    private readonly drizzleMigrator: DrizzleMigrator,
    private readonly drizzleSeeder: DrizzleSeeder,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.drizzleMigrator.applyMigrations();
    await this.drizzleSeeder.seed();
  }
}
