import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';
import { JwtConfigModule } from '../config/jwt.config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    PostModule,
    UserModule,
    JwtConfigModule
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
