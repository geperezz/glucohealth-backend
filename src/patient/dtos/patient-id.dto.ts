import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { patientDtoSchema } from './patient.dto';

export class PatientIdDto extends createZodDto(
  patientDtoSchema.pick({ id: true }),
) {
  id: z.infer<typeof patientDtoSchema>['id'] = super.id;
}
