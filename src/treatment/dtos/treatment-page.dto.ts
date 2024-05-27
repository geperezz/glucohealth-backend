import {
  buildPageDtoClass,
  buildPageDtoSchema,
} from 'src/pagination/dtos/page.dto';
import { treatmentDtoSchema } from './treatment.dto';

export const treatmentPageDto = buildPageDtoSchema(treatmentDtoSchema);

export class TreatmentPageDto extends buildPageDtoClass(treatmentDtoSchema) {}
