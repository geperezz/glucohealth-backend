import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { treatmentDtoSchema } from './treatment.dto';
import { treatmentMedicamentDtoSchema } from '../treatment-medicament/dtos/treatment-medicament.dto';

export const treatmentCreationDtoSchema = treatmentDtoSchema.extend({
  id: treatmentDtoSchema.shape.id.optional(),
  medicaments: z
    .array(
      treatmentMedicamentDtoSchema.extend({
        createdAt: treatmentMedicamentDtoSchema.shape.createdAt.optional(),
      }),
    )
    .min(1),
  createdAt: treatmentDtoSchema.shape.createdAt.optional(),
});

export class TreatmentCreationDto extends createZodDto(
  treatmentCreationDtoSchema,
) {}
