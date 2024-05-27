import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TreatmentMedicamentRepository } from './treatment-medicament.repository';
import { TreatmentMedicamentTakingScheduleModule } from './treatment-medicament-taking-schedule/treatment-medicament-taking-schedule.module';

@Module({
  imports: [DrizzleModule, TreatmentMedicamentTakingScheduleModule],
  providers: [TreatmentMedicamentRepository],
  exports: [TreatmentMedicamentRepository],
})
export class TreatmentMedicamentModule {}
