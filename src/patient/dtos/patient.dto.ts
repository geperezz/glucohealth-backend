import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';

import { Patient } from '../patient.repository';
import { InternalServerErrorException } from '@nestjs/common';

export const patientDtoSchema = z.object({
  id: z.coerce.number().int(),
  fullName: z.string().trim().min(1).nullable(),
  email: z.string().email(),
  phoneNumber: z.string().trim().min(1).nullable(),
  nationalId: z.string().trim().min(1),
  age: z.coerce.number().int().min(0).nullable(),
  weightInKg: z.coerce.number().gt(0).nullable(),
  heightInCm: z.coerce.number().min(1).nullable(),
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
