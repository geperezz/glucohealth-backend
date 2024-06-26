import { Module, forwardRef } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PatientRepository } from './patient.repository';
import { PatientController } from './patient.controller';
import { UserModule } from 'src/user/user.module';
import { PatientMedicamentTakenModule } from './patient-medicament-taken/patient-medicament-taken.module';
import { TreatmentModule } from 'src/treatment/treatment.module';
import { PatientMedicamentScheduleModule } from './patient-medicament-schedule/patient-medicament-schedule.module';

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    TreatmentModule,
    forwardRef(() => PatientMedicamentTakenModule),
    forwardRef(() => PatientMedicamentScheduleModule),
  ],
  controllers: [PatientController],
  providers: [PatientRepository],
  exports: [PatientRepository],
})
export class PatientModule {}
