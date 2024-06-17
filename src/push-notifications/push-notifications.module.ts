import { Module } from '@nestjs/common';

import { PushNotificationsService } from './push-notifications.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { PatientModule } from 'src/patient/patient.module';
import { PatientMedicamentScheduleModule } from 'src/patient/patient-medicament-schedule/patient-medicament-schedule.module';
import { MedicamentModule } from 'src/medicament/medicament.module';
import { TreatmentModule } from 'src/treatment/treatment.module';

@Module({
  imports: [
    DrizzleModule,
    PatientModule,
    PatientMedicamentScheduleModule,
    MedicamentModule,
    TreatmentModule,
  ],
  providers: [PushNotificationsService],
})
export class PushNotificationsModule {}
