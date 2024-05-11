import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { patientDtoSchema } from './patient.dto';
import { areTheTraitsWellSpecified } from 'src/unique-traits-validator/unique-traits.validator';
import { PatientUniqueTrait } from '../patient.repository';

export const patientUniqueTraitDtoSchema = patientDtoSchema
  .pick({
    id: true,
    email: true,
    nationalId: true,
  })
  .partial()
  .refine(
    ({ id, email, nationalId }) =>
      areTheTraitsWellSpecified([id, email, nationalId]),
    {
      message:
        'Must specify only one of the following unique traits in the query params: id, email, nationalId',
    },
  );

export class PatientUniqueTraitDto extends createZodDto(
  patientUniqueTraitDtoSchema,
) {
  static toModel(dto: PatientUniqueTraitDto): PatientUniqueTrait {
    if (dto.id !== undefined) {
      return PatientUniqueTrait.fromId(dto.id);
    }
    if (dto.email !== undefined) {
      return PatientUniqueTrait.fromEmail(dto.email);
    }
    return PatientUniqueTrait.fromNationalId(dto.nationalId!);
  }

  id?: z.infer<typeof patientUniqueTraitDtoSchema>['id'] = super.id;
  email?: z.infer<typeof patientUniqueTraitDtoSchema>['email'] = super.email;
  nationalId?: z.infer<typeof patientUniqueTraitDtoSchema>['nationalId'] = super
    .nationalId;
}
