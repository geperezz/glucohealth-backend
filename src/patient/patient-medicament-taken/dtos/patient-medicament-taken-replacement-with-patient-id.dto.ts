import { createZodDto } from 'nestjs-zod';

import { patientMedicamentTakenCreationWithPatientIdDtoSchema } from './patient-medicament-taken-creation-with-patient-id.dto';

export const patientMedicamentTakenReplacementWithPatientIdDtoSchema =
  patientMedicamentTakenCreationWithPatientIdDtoSchema;

export class PatientMedicamentTakenReplacementWithPatientIdDto extends createZodDto(
  patientMedicamentTakenReplacementWithPatientIdDtoSchema,
) {}
