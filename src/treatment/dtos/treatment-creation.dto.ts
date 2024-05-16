import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { treatmentDtoSchema } from './treatment.dto';
import { treatmentMedicamentDtoSchema } from '../treatment-medicament/dtos/treatment-medicament.dto';

export const treatmentCreationDtoSchema = treatmentDtoSchema.extend({
  id: treatmentDtoSchema.shape.id.optional(),
  medicaments: z.array(treatmentMedicamentDtoSchema).min(1),
});

export class TreatmentCreationDto extends createZodDto(
  treatmentCreationDtoSchema,
) {}
