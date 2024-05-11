import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { nurseDtoSchema } from './nurse.dto';
import { areTheTraitsWellSpecified } from 'src/unique-traits-validator/unique-traits.validator';
import { NurseUniqueTrait } from '../nurse.repository';

export const nurseUniqueTraitDtoSchema = nurseDtoSchema
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

export class NurseUniqueTraitDto extends createZodDto(
  nurseUniqueTraitDtoSchema,
) {
  static toModel(dto: NurseUniqueTraitDto): NurseUniqueTrait {
    if (dto.id !== undefined) {
      return NurseUniqueTrait.fromId(dto.id);
    }
    if (dto.email !== undefined) {
      return NurseUniqueTrait.fromEmail(dto.email);
    }
    return NurseUniqueTrait.fromNationalId(dto.nationalId!);
  }

  id?: z.infer<typeof nurseUniqueTraitDtoSchema>['id'] = super.id;
  email?: z.infer<typeof nurseUniqueTraitDtoSchema>['email'] = super.email;
  nationalId?: z.infer<typeof nurseUniqueTraitDtoSchema>['nationalId'] = super
    .nationalId;
}
