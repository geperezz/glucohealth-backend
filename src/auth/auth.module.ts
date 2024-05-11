import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import 'dotenv/config';

import { AuthGuard } from './auth.guard';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { APP_GUARD } from '@nestjs/core';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.AUTHENTICATION_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.AUTHENTICATION_TOKEN_EXPIRES_IN,
      },
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
