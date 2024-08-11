import { Injectable, NotFoundException, ForbiddenException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostService } from '../post/post.service';
import { Post } from '../post/schemas/post.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectModel('Comment') private readonly commentModel: Model<Comment>,
    @InjectModel('Post') private readonly postModel: Model<Post>,
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}
  

  async create(postId: string, createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    try {
      const post = await this.postService.findOne(postId);
      if (!post) {
        this.logger.warn(`Post not found`);
        throw new NotFoundException('Post not found');
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        this.logger.warn(`User not found`);
        throw new ForbiddenException('User not found');
      }

      const newComment = await this.commentModel.create({
        ...createCommentDto,
        post: postId,
        author: userId,
      });

      await this.postModel.updateOne(
        { _id: postId },
        { $push: { comments: newComment._id } }
      );

      
      this.logger.log(`Comment created successfully`);
      return newComment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to create comment for post: ${error.message}`);
      throw new InternalServerErrorException('Error creating comment');
    }
  }

  

  async findById(id: string): Promise<Comment> {
    try {
      const comment = await this.commentModel.findById(id).populate('author');
      if (!comment) {
        this.logger.warn(`Comment with ID not found`);
        throw new NotFoundException('Comment not found');
      }
      return comment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch comment: ${error.message}`);
      throw new InternalServerErrorException('Error fetching comment');
    }
  }

  async update(commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment> {
    try {
      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        this.logger.warn('Comment ID not found');
        throw new NotFoundException('Comment not found');
      }
      if (comment.author.toString() !== userId) {
        this.logger.warn('User is not allowed to update comment');
        throw new ForbiddenException('You do not have permission to update this comment');
      }
      const updatedComment = await this.commentModel.findByIdAndUpdate(commentId, updateCommentDto, { new: true });
      if (!updatedComment) {
        this.logger.warn('Failed to update comment');
        throw new NotFoundException('Comment not found');
      }
      this.logger.log('Comment updated by user');
      return updatedComment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to update comment: ${error.message}`);
      throw new InternalServerErrorException('Failed to update comment');
    }
  }
  

  async delete(id: string, userId: string): Promise<void> {
    try {
      const comment = await this.commentModel.findById(id);
      if (!comment) {
        this.logger.warn(`Comment not found`);
        throw new NotFoundException('Comment not found');
      }

      if (comment.author.toString() !== userId) {
        this.logger.warn(`User is not allowed to delete comment`);
        throw new ForbiddenException('You are not allowed to delete this comment');
      }

      await this.commentModel.findByIdAndDelete(id);
      this.logger.log(`Comment deleted by user`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to delete comment: ${error.message}`);
      throw new InternalServerErrorException('Error deleting comment');
    }
  }
}
