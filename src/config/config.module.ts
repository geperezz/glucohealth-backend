import { Global, Module } from '@nestjs/common';

import { loadConfigFromEnvFile } from './config.loader';

@Global()
@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: loadConfigFromEnvFile('.env'),
    },
  ],
  exports: ['CONFIG'],
})
export class ConfigModule {}
