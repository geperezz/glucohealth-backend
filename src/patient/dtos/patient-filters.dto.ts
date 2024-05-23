import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { patientDtoSchema } from './patient.dto';

export const patientFiltersDtoSchema = patientDtoSchema
  .omit({ treatment: true })
  .partial();

export class PatientFiltersDto extends createZodDto(patientFiltersDtoSchema) {
  id?: z.infer<typeof patientFiltersDtoSchema>['id'] = super.id;
  fullName?: z.infer<typeof patientFiltersDtoSchema>['fullName'] = super
    .fullName;
  email?: z.infer<typeof patientFiltersDtoSchema>['email'] = super.email;
  phoneNumber?: z.infer<typeof patientFiltersDtoSchema>['phoneNumber'] = super
    .phoneNumber;
  nationalId?: z.infer<typeof patientFiltersDtoSchema>['nationalId'] = super
    .nationalId;
  birthdate?: z.infer<typeof patientFiltersDtoSchema>['birthdate'] = super
    .birthdate;
  weightInKg?: z.infer<typeof patientFiltersDtoSchema>['weightInKg'] = super
    .weightInKg;
  heightInCm?: z.infer<typeof patientFiltersDtoSchema>['heightInCm'] = super
    .heightInCm;
}
