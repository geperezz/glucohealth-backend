import { createZodDto } from 'nestjs-zod';

import { patientCreationDtoSchema } from './patient-creation.dto';

export const patientUpdateDtoSchema = patientCreationDtoSchema
  .omit({
    password: true,
  })
  .partial();

export class PatientUpdateDto extends createZodDto(patientUpdateDtoSchema) {}
