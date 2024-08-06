import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigurationModule,UserModule],
})
export class AppModule {}
