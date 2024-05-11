import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { userDtoSchema } from 'src/user/dtos/user.dto';

export const loginInputDtoSchema = z
  .object({
    password: z.string().trim().min(1),
    id: userDtoSchema.shape.id.optional(),
    email: userDtoSchema.shape.email.optional(),
    nationalId: userDtoSchema.shape.nationalId.optional(),
  })
  .refine((loginDto) => loginDto.id || loginDto.email || loginDto.nationalId, {
    message:
      'At least one of the following fields must be provided: `id`, `email`, `nationalId`',
    path: ['id', 'email', 'nationalId'],
  });

export class LoginInputDto extends createZodDto(loginInputDtoSchema) {}
