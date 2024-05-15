import { createZodDto } from 'nestjs-zod';

import { patientMedicamentTakenCreationDtoSchema } from './patient-medicament-taken-creation.dto';

export const patientMedicamentTakenReplacementDtoSchema =
  patientMedicamentTakenCreationDtoSchema;

export class PatientMedicamentTakenReplacementDto extends createZodDto(
  patientMedicamentTakenReplacementDtoSchema,
) {}
