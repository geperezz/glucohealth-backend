import { createZodDto } from 'nestjs-zod';

import {
  PatientMedicamentSchedule,
  patientMedicamentScheduleSchema,
} from '../schemas/schedule.schema';

export const patientMedicamentScheduleDtoSchema =
  patientMedicamentScheduleSchema;

export class PatientMedicamentScheduleDto extends createZodDto(
  patientMedicamentScheduleDtoSchema,
) {
  static fromSchema(
    schedule: PatientMedicamentSchedule,
  ): PatientMedicamentScheduleDto {
    return patientMedicamentScheduleDtoSchema.parse(schedule);
  }
}
