import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export function buildPageDtoSchema<ItemSchema extends z.ZodTypeAny>(
  itemSchema: ItemSchema,
) {
  return z.object({
    items: z.array(itemSchema),
    pageIndex: z.number().int().min(1),
    itemsPerPage: z.number().int().min(1),
    pageCount: z.number().int().min(0),
    itemCount: z.number().int().min(0),
  });
}

export function buildPageDtoClass<ItemSchema extends z.ZodTypeAny>(
  itemSchema: ItemSchema,
) {
  return createZodDto(buildPageDtoSchema(itemSchema));
}
