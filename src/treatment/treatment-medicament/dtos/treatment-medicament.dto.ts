import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';
import * as cronParser from 'cron-parser';

import { medicamentDtoSchema } from 'src/medicament/dtos/medicament.dto';
import { TreatmentMedicament } from '../treatment-medicament.repository';

export const treatmentMedicamentDtoSchema = z.object({
  medicamentId: medicamentDtoSchema.shape.id,
  dose: z.string().trim().min(1),
  takingSchedulesStartingTimestamp: z.coerce.date(),
  takingSchedulesEndingTimestamp: z.coerce.date().optional(),
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
