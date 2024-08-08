import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(@InjectModel('Post') private readonly postModel: Model<Post>) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    try {
      const createdPost = await this.postModel.create({
        ...createPostDto,
        author: userId,
      });
      this.logger.log(`Post created successfully by user ${userId}`);
      return createdPost;
    } catch (error) {
      this.logger.error(`Failed to create post for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Error creating post');
    }
  }
  

  async findAll(): Promise<Post[]> {
    try {
      const posts = await this.postModel.find();
      this.logger.log('Successfully fetched all posts');
      return posts;
    } catch (error) {
      this.logger.error('Failed to fetch posts',);
      throw new InternalServerErrorException('Error fetching posts');
    }
  }

  async findOne(id: string): Promise<Post> {
    
      const post = await this.postModel.findById(id);
      if (!post) {
        this.logger.warn(`Post with ID ${id} not found`);
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
      try {
      this.logger.log(`Successfully fetched post with ID ${id}`);
      return post;
    } catch (error) {
      this.logger.error(`Failed to fetch post with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error fetching post');
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<Post> {
  
      const updatedPost = await this.postModel.findOneAndUpdate(
        { _id: id, author: userId },
        updatePostDto,
        { new: true }
      );

      if (!updatedPost) {
        this.logger.warn(`Post with ID ${id} not found or not owned by user ${userId}`);
        throw new NotFoundException(`Post with ID ${id} not found or not owned by user`);
      }
      try { 
      this.logger.log(`Successfully updated post with ID ${id} by user ${userId}`);
      return updatedPost;
    } catch (error) {
      this.logger.error(`Failed to update post with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error updating post');
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    
      const result = await this.postModel.findOneAndDelete({ _id: id, author: userId });
      if (!result) {
        this.logger.warn(`Post with ID ${id} not found or not owned by user ${userId}`);
        throw new NotFoundException(`Post with ID ${id} not found or not owned by user`);
      }
    try {
      this.logger.log(`Successfully deleted post with ID ${id} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete post with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error deleting post');
    }
  }
}
