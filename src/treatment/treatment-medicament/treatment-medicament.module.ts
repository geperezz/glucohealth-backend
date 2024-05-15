import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TreatmentMedicamentRepository } from './treatment-medicament.repository';

@Module({
  imports: [DrizzleModule],
  providers: [TreatmentMedicamentRepository],
  exports: [TreatmentMedicamentRepository],
})
export class TreatmentMedicamentModule {}
