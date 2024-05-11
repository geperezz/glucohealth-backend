import { createZodDto } from 'nestjs-zod';
import { ZodError } from 'nestjs-zod/z';

import { Nurse } from '../nurse.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { userDtoSchema } from 'src/user/dtos/user.dto';

export const nurseDtoSchema = userDtoSchema.omit({ role: true });

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
