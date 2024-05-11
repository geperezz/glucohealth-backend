import { createZodDto } from 'nestjs-zod';

import { nurseCreationDtoSchema } from './nurse-creation.dto';

export const nurseReplacementDtoSchema = nurseCreationDtoSchema;

export class NurseReplacementDto extends createZodDto(
  nurseReplacementDtoSchema,
) {}
