import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';

import { PatientMedicamentTaken } from '../patient-medicament-taken.repository';
import { treatmentDtoSchema } from 'src/treatment/dtos/treatment.dto';
import { patientDtoSchema } from 'src/patient/dtos/patient.dto';
import { medicamentDtoSchema } from 'src/medicament/dtos/medicament.dto';

export const patientMedicamentTakenDtoSchema = z.object({
  id: z.coerce.number().int(),
  patientId: patientDtoSchema.shape.id,
  treatmentId: treatmentDtoSchema.shape.id,
  medicamentId: medicamentDtoSchema.shape.id,
  takingTimestamp: z.coerce.date(),
});

export class PatientMedicamentTakenDto extends createZodDto(
  patientMedicamentTakenDtoSchema,
) {
  static fromModel(
    patientMedicamentTaken: PatientMedicamentTaken,
  ): PatientMedicamentTakenDto {
    try {
      return patientMedicamentTakenDtoSchema.parse(patientMedicamentTaken);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          'An error ocurred while parsing a PatientMedicamentTakenDto:',
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
