import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async create(createPostDto: CreatePostDto, token: string): Promise<Post> {
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn(`User with ID ${userId} not found`);
      throw new ForbiddenException('User not found');
    }

    const newPost = new this.postModel({ ...createPostDto, author: userId });
    const savedPost = await newPost.save();
    this.logger.log(`Post created with ID ${savedPost._id}`);
    return savedPost;
  }

  async findAll(): Promise<Post[]> {
    const posts = await this.postModel.find().populate('author').exec();
    this.logger.log('Retrieved all posts');
    return posts;
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).populate('author');
    if (!post) {
      this.logger.warn(`Post with ID ${id} not found`);
      throw new NotFoundException('Post not found');
    }
    this.logger.log(`Post with ID ${id} retrieved`);
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, token: string): Promise<Post> {
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const post = await this.postModel.findById(id);
    if (!post) {
      this.logger.warn(`Post with ID ${id} not found`);
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      this.logger.warn(`User with ID ${userId} is not allowed to update post with ID ${id}`);
      throw new ForbiddenException('You are not allowed to update this post');
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(id, updatePostDto, { new: true }).populate('author').exec();
    this.logger.log(`Post with ID ${id} updated`);
    return updatedPost;
  }

  async delete(id: string, token: string): Promise<void> {
    const decoded = this.jwtService.decode(token) as { sub: string };
    const userId = decoded.sub;

    const post = await this.postModel.findById(id);
    if (!post) {
      this.logger.warn(`Post with ID ${id} not found`);
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      this.logger.warn(`User with ID ${userId} is not allowed to delete post with ID ${id}`);
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.postModel.findByIdAndDelete(id).exec();
    this.logger.log(`Post with ID ${id} deleted`);
  }
}
