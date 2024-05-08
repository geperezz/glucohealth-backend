import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { nurseDtoSchema } from './nurse.dto';
import { areTheTraitsWellSpecified } from 'src/unique-traits-validator/unique-traits.validator';

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
  id?: z.infer<typeof nurseUniqueTraitDtoSchema>['id'] = super.id;
  email?: z.infer<typeof nurseUniqueTraitDtoSchema>['email'] = super.email;
  nationalId?: z.infer<typeof nurseUniqueTraitDtoSchema>['nationalId'] = super
    .nationalId;
}
