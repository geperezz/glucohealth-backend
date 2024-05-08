import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';

import { Nurse } from '../nurse.repository';
import { InternalServerErrorException } from '@nestjs/common';

export const nurseDtoSchema = z.object({
  id: z.coerce.number().int(),
  fullName: z.string().trim().min(1),
  email: z.string().email(),
  phoneNumber: z.string().trim().min(1),
  nationalId: z.string().trim().min(1),
});

export class NurseDto extends createZodDto(nurseDtoSchema) {
  static fromModel(nurse: Nurse) {
    try {
      return nurseDtoSchema.parse(nurse);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('An error ocurred while parsing a NurseDto:', error);
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
