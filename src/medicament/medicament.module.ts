import { Module } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { MedicamentRepository } from './medicament.repository';
import { MedicamentController } from './medicament.controller';

@Module({
  imports: [DrizzleModule],
  controllers: [MedicamentController],
  providers: [MedicamentRepository],
  exports: [MedicamentRepository],
})
export class MedicamentModule {}
