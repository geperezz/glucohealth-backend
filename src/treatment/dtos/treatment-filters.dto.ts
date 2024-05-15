import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { treatmentDtoSchema } from './treatment.dto';

export const treatmentFiltersDtoSchema = treatmentDtoSchema
  .omit({ medicaments: true })
  .partial();

export class TreatmentFiltersDto extends createZodDto(
  treatmentFiltersDtoSchema,
) {
  id?: z.infer<typeof treatmentFiltersDtoSchema>['id'] = super.id;
  patientId?: z.infer<typeof treatmentFiltersDtoSchema>['patientId'] = super
    .patientId;
  createdAt?: z.infer<typeof treatmentFiltersDtoSchema>['createdAt'] = super
    .createdAt;
}
