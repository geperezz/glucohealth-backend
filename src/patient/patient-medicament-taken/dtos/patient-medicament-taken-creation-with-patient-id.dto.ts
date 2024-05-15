import { createZodDto } from 'nestjs-zod';
import { patientMedicamentTakenDtoSchema } from './patient-medicament-taken.dto';

export const patientMedicamentTakenCreationWithPatientIdDtoSchema =
  patientMedicamentTakenDtoSchema.extend({
    id: patientMedicamentTakenDtoSchema.shape.id.optional(),
  });

export class PatientMedicamentTakenCreationWithPatientIdDto extends createZodDto(
  patientMedicamentTakenCreationWithPatientIdDtoSchema,
) {}
