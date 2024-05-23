import { createZodDto } from 'nestjs-zod';

import { treatmentDtoSchema } from './treatment.dto';

export const treatmentReplacementDtoSchema = treatmentDtoSchema
  .omit({ patientId: true })
  .extend({
    id: treatmentDtoSchema.shape.id.optional(),
  });

export class TreatmentReplacementDto extends createZodDto(
  treatmentReplacementDtoSchema,
) {}
