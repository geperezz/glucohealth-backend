import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';

import { Patient } from '../patient.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { patientDtoSchema } from './patient.dto';

export const patientWithPasswordDtoSchema = patientDtoSchema.extend({
  password: z.string().trim().min(1),
});

export class PatientWithPasswordDto extends createZodDto(
  patientWithPasswordDtoSchema,
) {
  static fromModel(patient: Patient) {
    try {
      return patientWithPasswordDtoSchema.parse(patient);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          'An error ocurred while parsing a PatientWithPasswordDto:',
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
