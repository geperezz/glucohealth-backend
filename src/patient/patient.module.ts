import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PatientRepository } from './patient.repository';
import { PatientController } from './patient.controller';

@Module({
  imports: [DrizzleModule],
  controllers: [PatientController],
  providers: [PatientRepository],
  exports: [PatientRepository],
})
export class PatientModule {}
