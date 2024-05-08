import {
  buildPageDtoClass,
  buildPageDtoSchema,
} from 'src/pagination/dtos/page.dto';
import { medicamentDtoSchema } from './medicament.dto';

export const medicamentPageDto = buildPageDtoSchema(medicamentDtoSchema);

export class MedicamentPageDto extends buildPageDtoClass(medicamentDtoSchema) {}
