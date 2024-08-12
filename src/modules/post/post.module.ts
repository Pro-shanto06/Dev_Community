import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {  PostSchema } from './schemas/post.schema';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { UserModule } from '../user/user.module'; 
import { UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'User', schema: UserSchema }
    ]),
    UserModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
