import { createZodDto } from 'nestjs-zod';

import { patientCreationDtoSchema } from './patient-creation.dto';

export const patientReplacementDtoSchema = patientCreationDtoSchema;

export class PatientReplacementDto extends createZodDto(
  patientReplacementDtoSchema,
) {}
