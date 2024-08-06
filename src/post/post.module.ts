import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { JwtConfigModule } from '../config/jwt-config.module';
import { UserModule } from '../user/user.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    JwtConfigModule, 
    UserModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
