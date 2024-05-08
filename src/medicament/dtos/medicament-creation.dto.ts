import { createZodDto } from 'nestjs-zod';

import { medicamentDtoSchema } from './medicament.dto';

export const medicamentCreationDtoSchema = medicamentDtoSchema.extend({
  id: medicamentDtoSchema.shape.id.optional(),
  tradeName: medicamentDtoSchema.shape.tradeName.default(null),
});

export class MedicamentCreationDto extends createZodDto(
  medicamentCreationDtoSchema,
) {}
