import {
  buildPageDtoClass,
  buildPageDtoSchema,
} from 'src/pagination/dtos/page.dto';
import { patientDtoSchema } from './patient.dto';

export const patientPageDto = buildPageDtoSchema(patientDtoSchema);

export class PatientPageDto extends buildPageDtoClass(patientDtoSchema) {}
