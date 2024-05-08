import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { nurseDtoSchema } from './nurse.dto';

export const nurseCreationDtoSchema = nurseDtoSchema.extend({
  id: nurseDtoSchema.shape.id.optional(),
  password: z.string().trim().min(1).optional(),
});

export class NurseCreationDto extends createZodDto(nurseCreationDtoSchema) {}
