import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { NurseRepository } from './nurse.repository';
import { NurseController } from './nurse.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [NurseController],
  providers: [NurseRepository],
  exports: [NurseRepository],
})
export class NurseModule {}
