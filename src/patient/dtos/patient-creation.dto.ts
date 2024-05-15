import { createZodDto } from 'nestjs-zod';

import { patientWithPasswordDtoSchema } from './patient-with-password.dto';

export const patientCreationDtoSchema = patientWithPasswordDtoSchema
  .omit({ treatments: true })
  .partial()
  .required({
    email: true,
    nationalId: true,
  });

export class PatientCreationDto extends createZodDto(
  patientCreationDtoSchema,
) {}
