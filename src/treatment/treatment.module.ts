import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { TreatmentMedicamentModule } from './treatment-medicament/treatment-medicament.module';
import { TreatmentRepository } from './treatment.repository';
import { TreatmentController } from './treatment.controller';

@Module({
  imports: [DrizzleModule, TreatmentMedicamentModule],
  controllers: [TreatmentController],
  providers: [TreatmentRepository],
  exports: [TreatmentRepository],
})
export class TreatmentModule {}
