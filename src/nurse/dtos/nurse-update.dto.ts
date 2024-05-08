import { createZodDto } from 'nestjs-zod';

import { nurseCreationDtoSchema } from './nurse-creation.dto';

export const nurseUpdateDtoSchema = nurseCreationDtoSchema.partial();

export class NurseUpdateDto extends createZodDto(nurseUpdateDtoSchema) {}
