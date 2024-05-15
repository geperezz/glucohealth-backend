import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';
import * as cronParser from 'cron-parser';

import { medicamentDtoSchema } from 'src/medicament/dtos/medicament.dto';
import { TreatmentMedicament } from '../treatment-medicament.repository';

export const treatmentMedicamentDtoSchema = z.object({
  medicamentId: medicamentDtoSchema.shape.id,
  takingSchedule: z.string().refine((takingSchedule) => {
    try {
      cronParser.parseExpression(takingSchedule);
      return true;
    } catch (err) {
      return false;
    }
  }),
  createdAt: z.coerce.date(),
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
