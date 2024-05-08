import {
  buildPageDtoClass,
  buildPageDtoSchema,
} from 'src/pagination/dtos/page.dto';
import { nurseDtoSchema } from './nurse.dto';

export const nursePageDto = buildPageDtoSchema(nurseDtoSchema);

export class NursePageDto extends buildPageDtoClass(nurseDtoSchema) {}
