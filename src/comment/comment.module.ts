import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentSchema } from './schemas/comment.schema';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';
import { PostSchema } from '../post/schemas/post.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Comment', schema: CommentSchema },
      { name: 'Post', schema: PostSchema },
    ]),
    PostModule,
    UserModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
