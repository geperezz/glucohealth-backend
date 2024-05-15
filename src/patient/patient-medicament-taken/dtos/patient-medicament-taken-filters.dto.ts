import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { patientMedicamentTakenDtoSchema } from './patient-medicament-taken.dto';

export const patientMedicamentTakenFiltersDtoSchema =
  patientMedicamentTakenDtoSchema.partial();

export class PatientMedicamentTakenFiltersDto extends createZodDto(
  patientMedicamentTakenFiltersDtoSchema,
) {
  id?: z.infer<typeof patientMedicamentTakenFiltersDtoSchema>['id'] = super.id;
  patientId?: z.infer<
    typeof patientMedicamentTakenFiltersDtoSchema
  >['patientId'] = super.patientId;
  treatmentId?: z.infer<
    typeof patientMedicamentTakenFiltersDtoSchema
  >['treatmentId'] = super.treatmentId;
  medicamentId?: z.infer<
    typeof patientMedicamentTakenFiltersDtoSchema
  >['medicamentId'] = super.medicamentId;
  takingTimestamp?: z.infer<
    typeof patientMedicamentTakenFiltersDtoSchema
  >['takingTimestamp'] = super.takingTimestamp;
}
