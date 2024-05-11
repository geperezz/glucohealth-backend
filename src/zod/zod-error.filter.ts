import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'nestjs-zod/z';
import { Response } from 'express';

@Catch(ZodError)
export class ZodErrorFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    response.status(400).json({
      statusCode: 400,
      message: 'Validation Failed',
      errors: exception.errors.map((error) => ({
        error: error.message,
        path: error.path,
      })),
    });
  }
}
