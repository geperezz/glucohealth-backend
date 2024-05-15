import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';

import { Treatment } from '../treatment.repository';
import { treatmentMedicamentDtoSchema } from '../treatment-medicament/dtos/treatment-medicament.dto';

export const treatmentDtoSchema = z.object({
  id: z.coerce.number().int(),
  patientId: z.coerce.number().int(),
  medicaments: z.array(treatmentMedicamentDtoSchema).min(1),
  createdAt: z.coerce.date(),
});

export class TreatmentDto extends createZodDto(treatmentDtoSchema) {
  static fromModel(nurse: Treatment) {
    try {
      return treatmentDtoSchema.parse(nurse);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('An error ocurred while parsing a TreatmentDto:', error);
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
