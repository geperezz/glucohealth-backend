import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { fromError } from 'zod-validation-error';

export const ValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    new BadRequestException('Validation failed', {
      description: fromError(error, { prefix: null }).toString(),
      cause: error,
    }),
});
