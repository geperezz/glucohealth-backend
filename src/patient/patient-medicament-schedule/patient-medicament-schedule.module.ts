import { Module, forwardRef } from '@nestjs/common';

import { PatientMedicamentScheduleService } from './patient-medicament-schedule.service';
import { PatientMedicamentScheduleController } from './patient-medicament-schedule.controller';

import { PatientModule } from 'src/patient/patient.module';
import { PatientMedicamentTakenModule } from '../patient-medicament-taken/patient-medicament-taken.module';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [
    DrizzleModule,
    forwardRef(() => PatientModule),
    PatientMedicamentTakenModule,
  ],
  providers: [PatientMedicamentScheduleService],
  controllers: [PatientMedicamentScheduleController],
  exports: [PatientMedicamentScheduleService],
})
export class PatientMedicamentScheduleModule {}
