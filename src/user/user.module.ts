import { Module, forwardRef } from '@nestjs/common';

import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  imports: [forwardRef(() => DrizzleModule)],
  controllers: [UserController],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
