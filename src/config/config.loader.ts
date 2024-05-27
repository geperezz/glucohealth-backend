import { ZodError, z } from 'nestjs-zod/z';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { fromError } from 'zod-validation-error';

const configSchema = z.object({
  APP_PORT: z.coerce.number().min(0),
  DATABASE_USER: z.string().trim().min(1),
  DATABASE_PASSWORD: z.string().trim().min(1),
  DATABASE_HOST: z.string().trim().min(1),
  DATABASE_PORT: z.string().trim().min(1),
  DATABASE_NAME: z.string().trim().min(1),
  DATABASE_URL: z.string().url(),
  AUTHENTICATION_TOKEN_SECRET: z.string().trim().min(1),
  AUTHENTICATION_TOKEN_EXPIRES_IN: z.string().trim().min(1),
  FRONTEND_URL: z.string().url().or(z.literal('*')),
  EMAIL_HOST: z.string().trim().min(1),
  EMAIL_USERNAME: z.string().trim().min(1),
  EMAIL_PASSWORD: z.string().trim().min(1),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfigFromEnvFile(envFilePath: string): Config {
  try {
    const { parsed: envFileVariables } = dotenvExpand.expand(
      dotenv.config({
        path: envFilePath,
      }),
    );
    return configSchema.parse(envFileVariables);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromError(error, { prefix: 'Invalid environment configuration' });
    }
    throw error;
  }
}
