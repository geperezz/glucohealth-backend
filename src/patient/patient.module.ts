import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PatientRepository } from './patient.repository';
import { PatientController } from './patient.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [PatientController],
  providers: [PatientRepository],
  exports: [PatientRepository],
})
export class PatientModule {}
