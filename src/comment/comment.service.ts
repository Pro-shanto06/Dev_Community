import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtService } from '@nestjs/jwt';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly jwtService: JwtService,
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  async create(postId: string, createCommentDto: CreateCommentDto, token: string): Promise<Comment> {
    this.logger.log(`Creating a comment for post ${postId}`);
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const post = await this.postService.findById(postId);
    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException('Post not found');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      throw new ForbiddenException('User not found');
    }

    const newComment = new this.commentModel({
      ...createCommentDto,
      post: postId,
      author: userId,
    });

    this.logger.log(`Comment created for post ${postId} by user ${userId}`);
    return newComment.save();
  }

  async findAll(postId: string): Promise<Comment[]> {
    this.logger.log(`Fetching all comments for post ${postId}`);
    return this.commentModel.find({ post: postId }).populate('author').exec();
  }

  async findById(id: string): Promise<Comment> {
    this.logger.log(`Fetching comment with id ${id}`);
    const comment = await this.commentModel.findById(id).populate('author');
    if (!comment) {
      this.logger.warn(`Comment with id ${id} not found`);
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, token: string): Promise<Comment> {
    this.logger.log(`Updating comment with id ${id}`);
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      this.logger.warn(`Comment with id ${id} not found`);
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      this.logger.warn(`User ${userId} is not allowed to update comment ${id}`);
      throw new ForbiddenException('You are not allowed to update this comment');
    }

    this.logger.log(`Comment with id ${id} updated by user ${userId}`);
    return this.commentModel.findByIdAndUpdate(id, updateCommentDto, { new: true }).populate('author').exec();
  }

  async delete(id: string, token: string): Promise<void> {
    this.logger.log(`Deleting comment with id ${id}`);
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const comment = await this.commentModel.findById(id);
    if (!comment) {
      this.logger.warn(`Comment with id ${id} not found`);
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      this.logger.warn(`User ${userId} is not allowed to delete comment ${id}`);
      throw new ForbiddenException('You are not allowed to delete this comment');
    }

    await this.commentModel.findByIdAndDelete(id).exec();
    this.logger.log(`Comment with id ${id} deleted by user ${userId}`);
  }
}
