import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { UserService } from '../user/user.service';
import { User } from '../user/schemas/user.schema';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

describe('PostService', () => {
  let postService: PostService;
  let mockPostModel: Model<Post>;
  let mockUserModel: Model<User>;
  let mockUserService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getModelToken('Post'),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
          },
        },
        {
          provide: getModelToken('User'),
          useValue: {
            updateOne: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            // Mocking UserService if needed
          },
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    mockPostModel = module.get<Model<Post>>(getModelToken('Post'));
    mockUserModel = module.get<Model<User>>(getModelToken('User'));
    mockUserService = module.get<UserService>(UserService);

    jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
    jest.spyOn(postService['logger'], 'warn').mockImplementation(jest.fn());
    jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createPostDto: CreatePostDto = { title: 'New Post', content: 'Post content' };
      const userId = 'user123';
      const createdPost = { _id: 'post123', ...createPostDto, author: userId };

      mockPostModel.create = jest.fn().mockResolvedValue(createdPost);
      mockUserModel.updateOne = jest.fn().mockResolvedValue({});

      const result = await postService.create(createPostDto, userId);

      expect(result).toEqual(createdPost);
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...createPostDto,
        author: userId,
      });
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: userId },
        { $push: { posts: createdPost._id } }
      );
      expect(postService['logger'].log).toHaveBeenCalledWith(`Post created successfully by user ${userId}`);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const createPostDto: CreatePostDto = { title: 'New Post', content: 'Post content' };
      const userId = 'user123';
      const errorMessage = 'Unexpected error';

      mockPostModel.create = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(postService.create(createPostDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to create post for user ${userId}: ${errorMessage}`);
    });
  });

  describe('findAll', () => {
    it('should return all posts successfully', async () => {
      const posts = [{ _id: 'post123', title: 'Post 1' }, { _id: 'post456', title: 'Post 2' }];

      mockPostModel.find = jest.fn().mockResolvedValue(posts);

      const result = await postService.findAll();

      expect(result).toEqual(posts);
      expect(mockPostModel.find).toHaveBeenCalled();
      expect(postService['logger'].log).toHaveBeenCalledWith('Successfully fetched all posts');
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const errorMessage = 'Unexpected error';

      mockPostModel.find = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(postService.findAll()).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith('Failed to fetch posts');
    });
  });

  describe('findOne', () => {
    it('should find a post by ID successfully', async () => {
      const postId = 'post123';
      const post = { _id: postId, title: 'Post Title' };

      mockPostModel.findById = jest.fn().mockResolvedValue(post);

      const result = await postService.findOne(postId);

      expect(result).toEqual(post);
      expect(mockPostModel.findById).toHaveBeenCalledWith(postId);
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully fetched post with ID ${postId}`);
    });

    it('should throw NotFoundException if post is not found and log a warning', async () => {
      const postId = 'post123';

      mockPostModel.findById = jest.fn().mockResolvedValue(null);

      await expect(postService.findOne(postId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found`);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const postId = 'post123';
      const errorMessage = 'Unexpected error';

      mockPostModel.findById = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(postService.findOne(postId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to fetch post with ID ${postId}: ${errorMessage}`);
    });
  });

  describe('update', () => {
    it('should update a post successfully', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post Title' };
      const updatedPost = { _id: postId, ...updatePostDto, author: userId };

      mockPostModel.findOneAndUpdate = jest.fn().mockResolvedValue(updatedPost);

      const result = await postService.update(postId, updatePostDto, userId);

      expect(result).toEqual(updatedPost);
      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: postId, author: userId },
        updatePostDto,
        { new: true }
      );
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully updated post with ID ${postId} by user ${userId}`);
    });

    it('should throw NotFoundException if post is not found or not owned by user and log a warning', async () => {
      const postId = 'post123';
      const userId = 'user123';

      mockPostModel.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(postService.update(postId, { title: 'Updated Title' }, userId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found or not owned by user ${userId}`);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const errorMessage = 'Unexpected error';

      mockPostModel.findOneAndUpdate = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(postService.update(postId, { title: 'Updated Title' }, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to update post with ID ${postId}: ${errorMessage}`);
    });
  });

  describe('delete', () => {
    it('should delete a post successfully', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const result = { _id: postId, author: userId };

      mockPostModel.findOneAndDelete = jest.fn().mockResolvedValue(result);

      await postService.delete(postId, userId);

      expect(mockPostModel.findOneAndDelete).toHaveBeenCalledWith({ _id: postId, author: userId });
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully deleted post with ID ${postId} by user ${userId}`);
    });

    it('should throw NotFoundException if post is not found or not owned by user and log a warning', async () => {
      const postId = 'post123';
      const userId = 'user123';

      mockPostModel.findOneAndDelete = jest.fn().mockResolvedValue(null);

      await expect(postService.delete(postId, userId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found or not owned by user ${userId}`);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const errorMessage = 'Unexpected error';

      mockPostModel.findOneAndDelete = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(postService.delete(postId, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to delete post with ID ${postId}: ${errorMessage}`);
    });
  });
});
