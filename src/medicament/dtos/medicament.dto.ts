import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';

import { Medicament } from '../medicament.repository';
import { InternalServerErrorException } from '@nestjs/common';

export const medicamentDtoSchema = z.object({
  id: z.coerce.number().int(),
  tradeName: z.string().trim().min(1).nullable(),
  genericName: z.string().trim().min(1),
  description: z.string().trim().min(1),
  sideEffects: z.array(z.string().trim()),
  presentations: z.array(z.string().trim().min(1)),
});

export class MedicamentDto extends createZodDto(medicamentDtoSchema) {
  static fromModel(nurse: Medicament) {
    try {
      return medicamentDtoSchema.parse(nurse);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('An error ocurred while parsing a MedicamentDto:', error);
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
