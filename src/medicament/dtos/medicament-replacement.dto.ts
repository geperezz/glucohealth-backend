import { createZodDto } from 'nestjs-zod';

import { medicamentCreationDtoSchema } from './medicament-creation.dto';

export const medicamentReplacementDtoSchema = medicamentCreationDtoSchema;

export class MedicamentReplacementDto extends createZodDto(
  medicamentReplacementDtoSchema,
) {}
