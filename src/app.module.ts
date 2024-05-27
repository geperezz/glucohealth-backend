import { Module } from '@nestjs/common';

import { ValidationModule } from './validation/validation.module';
import { NurseModule } from './nurse/nurse.module';
import { PatientModule } from './patient/patient.module';
import { MedicamentModule } from './medicament/medicament.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { TreatmentModule } from './treatment/treatment.module';
import { SuccessfulResponseBuilderModule } from './successful-response-builder/succesful-response-builder.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    ValidationModule,
    SuccessfulResponseBuilderModule,
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
})
export class AppModule {}
