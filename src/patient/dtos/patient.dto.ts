import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';

import { Patient } from '../patient.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { userDtoSchema } from 'src/user/dtos/user.dto';
import { treatmentDtoSchema } from 'src/treatment/dtos/treatment.dto';

export const patientDtoSchema = userDtoSchema.omit({ role: true }).extend({
  age: z.coerce.number().int().min(0).nullable(),
  weightInKg: z.coerce.number().gt(0).nullable(),
  heightInCm: z.coerce.number().min(1).nullable(),
  bmi: z.coerce.number().gt(0).nullable(),
  treatments: z.array(treatmentDtoSchema.omit({ patientId: true })),
});

export class PatientDto extends createZodDto(patientDtoSchema) {
  static fromModel(patient: Patient) {
    try {
      return patientDtoSchema.parse(patient);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('An error ocurred while parsing a PatientDto:', error);
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
