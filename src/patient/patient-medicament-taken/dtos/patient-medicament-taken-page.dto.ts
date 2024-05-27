import {
  buildPageDtoClass,
  buildPageDtoSchema,
} from 'src/pagination/dtos/page.dto';
import { patientMedicamentTakenDtoSchema } from './patient-medicament-taken.dto';

export const patientMedicamentTakenPageDtoSchema = buildPageDtoSchema(
  patientMedicamentTakenDtoSchema,
);

export class PatientMedicamentTakenPageDto extends buildPageDtoClass(
  patientMedicamentTakenDtoSchema,
) {}
