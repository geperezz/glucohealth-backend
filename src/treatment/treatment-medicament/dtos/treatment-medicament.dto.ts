import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';
import * as cronParser from 'cron-parser';

import { medicamentDtoSchema } from 'src/medicament/dtos/medicament.dto';
import { TreatmentMedicament } from '../treatment-medicament.repository';

export const treatmentMedicamentDtoSchema = z.object({
  medicamentId: medicamentDtoSchema.shape.id,
  dose: z.string().trim().min(1),
  takingSchedulesStartingTimestamp: z.coerce
    .date()
    .transform((takingSchedulesStartingTimestamp) => {
      takingSchedulesStartingTimestamp.setHours(0, 0, 0);
      return takingSchedulesStartingTimestamp;
    }),
  takingSchedulesEndingTimestamp: z.coerce
    .date()
    .nullable()
    .default(null)
    .transform((takingSchedulesEndingTimestamp) => {
      if (takingSchedulesEndingTimestamp) {
        takingSchedulesEndingTimestamp.setHours(0, 0, 0);
      }
      return takingSchedulesEndingTimestamp;
    }),
  takingSchedules: z
    .array(
      z.object({
        takingSchedule: z.string(),
      }),
    )
    .min(1)
    .refine((takingSchedules) => {
      try {
        takingSchedules.map(({ takingSchedule }) =>
          cronParser.parseExpression(takingSchedule),
        );
        return true;
      } catch (err) {
        return false;
      }
    }),
});

export class TreatmentMedicamentDto extends createZodDto(
  treatmentMedicamentDtoSchema,
) {
  static fromModel(nurse: TreatmentMedicament) {
    try {
      return treatmentMedicamentDtoSchema.parse(nurse);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          'An error ocurred while parsing a TreatmentMedicamentDto:',
          error,
        );
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
