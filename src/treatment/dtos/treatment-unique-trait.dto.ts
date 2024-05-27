import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { treatmentDtoSchema } from './treatment.dto';
import { TreatmentUniqueTrait } from '../treatment.repository';

export const treatmentUniqueTraitDtoSchema = treatmentDtoSchema.pick({
  id: true,
});

export class TreatmentUniqueTraitDto extends createZodDto(
  treatmentUniqueTraitDtoSchema,
) {
  id: z.infer<typeof treatmentUniqueTraitDtoSchema>['id'] = super.id;

  static toModel(trait: TreatmentUniqueTraitDto): TreatmentUniqueTrait {
    return new TreatmentUniqueTrait(trait.id);
  }
}
