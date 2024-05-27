import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { patientMedicamentTakenDtoSchema } from './patient-medicament-taken.dto';
import { PatientMedicamentTakenUniqueTrait } from '../patient-medicament-taken.repository';

export const patientMedicamentTakenUniqueTraitDtoSchema =
  patientMedicamentTakenDtoSchema.pick({ id: true });

export class PatientMedicamentTakenUniqueTraitDto extends createZodDto(
  patientMedicamentTakenUniqueTraitDtoSchema,
) {
  id: z.infer<typeof patientMedicamentTakenUniqueTraitDtoSchema>['id'] = super
    .id;

  static toModel(
    trait: PatientMedicamentTakenUniqueTraitDto,
  ): PatientMedicamentTakenUniqueTrait {
    return new PatientMedicamentTakenUniqueTrait(trait.id);
  }
}
