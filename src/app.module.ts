import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigurationModule,UserModule,AuthModule],
})
export class AppModule {}
