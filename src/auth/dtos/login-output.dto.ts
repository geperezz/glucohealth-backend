import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { userDtoSchema } from 'src/user/dtos/user.dto';

export const loginOutputDtoSchema = z.object({
  token: z.string().trim().min(1),
  user: userDtoSchema,
});

export class LoginOutputDto extends createZodDto(loginOutputDtoSchema) {}
