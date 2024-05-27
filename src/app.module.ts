import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { NurseModule } from './nurse/nurse.module';
import { ZodErrorFilter } from './zod/zod-error.filter';
import { SuccessfulResponseBuilderInterceptor } from './successful-response-builder/successful-response-builder.interceptor';
import { PatientModule } from './patient/patient.module';
import { MedicamentModule } from './medicament/medicament.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { TreatmentModule } from './treatment/treatment.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    NurseModule,
    PatientModule,
    MedicamentModule,
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: process.env.EMAIL_HOST,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        },
        template: {
          dir: join(__dirname, '/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    TreatmentModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ZodErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessfulResponseBuilderInterceptor,
    },
  ],
})
export class AppModule {}
