import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { medicamentDtoSchema } from './medicament.dto';

export const medicamentFiltersDtoSchema = medicamentDtoSchema.partial().omit({
  sideEffects: true,
  presentations: true,
});

export class MedicamentFiltersDto extends createZodDto(
  medicamentFiltersDtoSchema,
) {
  id?: z.infer<typeof medicamentFiltersDtoSchema>['id'] = super.id;
  tradeName?: string | null = super.tradeName; // doesn't work when inferring the type, it must be specified explicitly
  genericName?: z.infer<typeof medicamentFiltersDtoSchema>['genericName'] =
    super.genericName;
  description?: z.infer<typeof medicamentFiltersDtoSchema>['description'] =
    super.description;
}
