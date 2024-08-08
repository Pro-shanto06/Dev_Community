import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('PostService', () => {
  let postService: PostService;
  let postModel: Model<Post>;

  const mockPostModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getModelToken('Post'),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    postModel = module.get<Model<Post>>(getModelToken('Post'));
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createPostDto: CreatePostDto = { title: 'Test Post', content: 'Content' };
      const userId = 'userId';
      const createdPost = { ...createPostDto, author: userId, _id: 'postId' } as any;

      mockPostModel.create.mockResolvedValue(createdPost);

      const result = await postService.create(createPostDto, userId);

      expect(result).toEqual(createdPost);
      expect(mockPostModel.create).toHaveBeenCalledWith({ ...createPostDto, author: userId });
    });

    it('should throw InternalServerErrorException on create error', async () => {
      const createPostDto: CreatePostDto = { title: 'Test Post', content: 'Content' };
      const userId = 'userId';
      mockPostModel.create.mockRejectedValue(new Error('Failed to create'));

      await expect(postService.create(createPostDto, userId))
        .rejects
        .toThrow(new InternalServerErrorException('Error creating post'));
    });
  });

  describe('findAll', () => {
    it('should return all posts', async () => {
      const posts = [{ title: 'Post 1' }, { title: 'Post 2' }] as any;
      mockPostModel.find.mockResolvedValue(posts);

      const result = await postService.findAll();

      expect(result).toEqual(posts);
      expect(mockPostModel.find).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on find all error', async () => {
      mockPostModel.find.mockRejectedValue(new Error('Failed to fetch'));

      await expect(postService.findAll())
        .rejects
        .toThrow(new InternalServerErrorException('Error fetching posts'));
    });
  });

  describe('findOne', () => {
    it('should return a post by ID', async () => {
      const postId = 'postId';
      const post = { title: 'Test Post', _id: postId } as any;
      mockPostModel.findById.mockResolvedValue(post);

      const result = await postService.findOne(postId);

      expect(result).toEqual(post);
      expect(mockPostModel.findById).toHaveBeenCalledWith(postId);
    });

    it('should throw InternalServerErrorException on find by ID error', async () => {
      const postId = 'postId';
      mockPostModel.findById.mockRejectedValue(new Error('Failed to fetch'));

      await expect(postService.findOne(postId))
        .rejects
        .toThrow(new InternalServerErrorException('Error fetching post'));
    });
  });

  describe('update', () => {
    it('should update a post by ID and user ID', async () => {
      const postId = 'postId';
      const userId = 'userId';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post' };
      const updatedPost = { ...updatePostDto, _id: postId } as any;

      mockPostModel.findOneAndUpdate.mockResolvedValue(updatedPost);

      const result = await postService.update(postId, updatePostDto, userId);

      expect(result).toEqual(updatedPost);
      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: postId, author: userId },
        updatePostDto,
        { new: true }
      );
    });

    it('should throw InternalServerErrorException on update error', async () => {
      const postId = 'postId';
      const userId = 'userId';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post' };

      mockPostModel.findOneAndUpdate.mockRejectedValue(new Error('Failed to update'));

      await expect(postService.update(postId, updatePostDto, userId))
        .rejects
        .toThrow(new InternalServerErrorException('Error updating post'));
    });
  });

  describe('delete', () => {
    it('should delete a post by ID and user ID', async () => {
      const postId = 'postId';
      const userId = 'userId';
      mockPostModel.findOneAndDelete.mockResolvedValue({ _id: postId } as any);

      await postService.delete(postId, userId);

      expect(mockPostModel.findOneAndDelete).toHaveBeenCalledWith({ _id: postId, author: userId });
    });


    it('should throw InternalServerErrorException on delete error', async () => {
      const postId = 'postId';
      const userId = 'userId';

      mockPostModel.findOneAndDelete.mockRejectedValue(new Error('Failed to delete'));

      await expect(postService.delete(postId, userId))
        .rejects
        .toThrow(new InternalServerErrorException('Error deleting post'));
    });
  });
});
