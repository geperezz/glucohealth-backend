import { createZodDto } from 'nestjs-zod';
import { patientMedicamentTakenDtoSchema } from './patient-medicament-taken.dto';

export const patientMedicamentTakenCreationDtoSchema =
  patientMedicamentTakenDtoSchema
    .omit({ patientId: true })
    .extend({ id: patientMedicamentTakenDtoSchema.shape.id.optional() });

export class PatientMedicamentTakenCreationDto extends createZodDto(
  patientMedicamentTakenCreationDtoSchema,
) {}
