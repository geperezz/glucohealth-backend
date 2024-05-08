import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { PaginationOptions } from '../models/pagination-options.model';

export const paginationOptionsDtoSchema = z.object({
  pageIndex: z.coerce.number().int().min(1).optional(),
  itemsPerPage: z.coerce.number().int().min(1).optional(),
});

export class PaginationOptionsDto extends createZodDto(
  paginationOptionsDtoSchema,
) {
  pageIndex?: z.infer<typeof paginationOptionsDtoSchema>['pageIndex'] = super
    .pageIndex;
  itemsPerPage?: z.infer<typeof paginationOptionsDtoSchema>['itemsPerPage'] =
    super.itemsPerPage;

  static toModel(
    paginationOptionsDto: PaginationOptionsDto,
  ): PaginationOptions {
    return new PaginationOptions(
      paginationOptionsDto.pageIndex,
      paginationOptionsDto.itemsPerPage,
    );
  }
}
