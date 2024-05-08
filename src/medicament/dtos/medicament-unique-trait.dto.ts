import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

import { medicamentDtoSchema } from './medicament.dto';
import { areTheTraitsWellSpecified } from 'src/unique-traits-validator/unique-traits.validator';
import { MedicamentUniqueTrait } from '../medicament.repository';

export const medicamentUniqueTraitDtoSchema = medicamentDtoSchema
  .pick({
    id: true,
    tradeName: true,
    genericName: true,
  })
  .partial()
  .refine(
    ({ id, tradeName, genericName }) =>
      areTheTraitsWellSpecified([id, [tradeName, genericName]]),
    {
      message:
        'Must specify only one of the following unique traits in the query params: id, [tradeName, genericName]',
    },
  );

export class MedicamentUniqueTraitDto extends createZodDto(
  medicamentUniqueTraitDtoSchema,
) {
  id?: z.infer<typeof medicamentUniqueTraitDtoSchema>['id'] = super.id;
  tradeName?: string | null = super.tradeName; // doesn't work when inferring the type, it must be specified explicitly
  genericName?: z.infer<typeof medicamentUniqueTraitDtoSchema>['genericName'] =
    super.genericName;

  static toModel(trait: MedicamentUniqueTraitDto): MedicamentUniqueTrait {
    return {
      id: trait.id,
      tradeName_genericName:
        trait.tradeName && trait.genericName
          ? {
              tradeName: trait.tradeName,
              genericName: trait.genericName,
            }
          : undefined,
    };
  }
}
