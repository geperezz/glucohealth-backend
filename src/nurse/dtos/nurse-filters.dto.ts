import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { nurseDtoSchema } from './nurse.dto';

export const nurseFiltersDtoSchema = nurseDtoSchema.partial();

export class NurseFiltersDto extends createZodDto(nurseFiltersDtoSchema) {
  id?: z.infer<typeof nurseFiltersDtoSchema>['id'] = super.id;
  fullName?: z.infer<typeof nurseFiltersDtoSchema>['fullName'] = super.fullName;
  email?: z.infer<typeof nurseFiltersDtoSchema>['email'] = super.email;
  phoneNumber?: z.infer<typeof nurseFiltersDtoSchema>['phoneNumber'] = super
    .phoneNumber;
  nationalId?: z.infer<typeof nurseFiltersDtoSchema>['nationalId'] = super
    .nationalId;
}
