import { createZodDto } from 'nestjs-zod';
import { treatmentCreationDtoSchema } from './treatment-creation.dto';

export const treatmentReplacementDtoSchema = treatmentCreationDtoSchema;

export class TreatmentReplacementDto extends createZodDto(
  treatmentReplacementDtoSchema,
) {}
