import { z } from 'nestjs-zod/z';

import { medicamentDtoSchema } from 'src/medicament/dtos/medicament.dto';

export const patientMedicamentScheduleSchema = z.object({
  medicamentId: medicamentDtoSchema.shape.id,
  dose: z.string(),
  schedule: z.array(
    z.object({
      expectedTakingTimestamp: z.coerce.date(),
      actualTakingTimestamp: z.coerce.date().nullable(),
    }),
  ),
});

export type PatientMedicamentSchedule = z.infer<
  typeof patientMedicamentScheduleSchema
>;
