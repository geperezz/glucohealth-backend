import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { NurseRepository } from './nurse.repository';
import { NurseController } from './nurse.controller';

@Module({
  imports: [DrizzleModule],
  controllers: [NurseController],
  providers: [NurseRepository],
  exports: [NurseRepository],
})
export class NurseModule {}
