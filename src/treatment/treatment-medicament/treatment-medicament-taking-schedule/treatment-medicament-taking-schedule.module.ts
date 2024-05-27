import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TreatmentMedicamentTakingScheduleRepository } from './treatment-medicament-taking-schedule.repository';

@Module({
  imports: [DrizzleModule],
  providers: [TreatmentMedicamentTakingScheduleRepository],
  exports: [TreatmentMedicamentTakingScheduleRepository],
})
export class TreatmentMedicamentTakingScheduleModule {}
