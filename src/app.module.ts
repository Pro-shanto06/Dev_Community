import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [ConfigurationModule,UserModule,AuthModule, PostModule, CommentModule],
})
export class AppModule {}
