import { Module, forwardRef } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PatientMedicamentTakenRepository } from './patient-medicament-taken.repository';
import { PatientMedicamentTakenController } from './patient-medicament-taken.controller';
import { PatientModule } from '../patient.module';

@Module({
  imports: [DrizzleModule, forwardRef(() => PatientModule)],
  controllers: [PatientMedicamentTakenController],
  providers: [PatientMedicamentTakenRepository],
  exports: [PatientMedicamentTakenRepository],
})
export class PatientMedicamentTakenModule {}
