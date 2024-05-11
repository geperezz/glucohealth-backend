import { createZodDto } from 'nestjs-zod';
import { ZodError, z } from 'nestjs-zod/z';
import { InternalServerErrorException } from '@nestjs/common';

import { User } from '../user.repository';

export const userDtoSchema = z.object({
  id: z.coerce.number().int(),
  fullName: z.string().trim().min(1).nullable(),
  email: z.string().email(),
  phoneNumber: z.string().trim().min(1).nullable(),
  nationalId: z.string().trim().min(1),
  role: z.enum(['admin', 'nurse', 'patient']),
});

export class UserDto extends createZodDto(userDtoSchema) {
  static fromModel(user: User): UserDto {
    try {
      return userDtoSchema.parse(user);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('An error ocurred while parsing a UserDto:', error);
        throw new InternalServerErrorException('Internal Server Error', {
          cause: error,
        });
      }
      throw error;
    }
  }
}
