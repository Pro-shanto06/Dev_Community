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
    beforeEach(() => {
      jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should create a post successfully and log the event', async () => {
      const createPostDto: CreatePostDto = { title: 'New Post', content: 'Post content' };
      const userId = 'user123';
      const createdPost = { ...createPostDto, author: userId, _id: 'post123' };
  
      mockPostModel.create.mockResolvedValue(createdPost);
  
      const result = await postService.create(createPostDto, userId);
  
      expect(result).toEqual(createdPost);
      expect(postService['logger'].log).toHaveBeenCalledWith(`Post created successfully by user ${userId}`);
      expect(mockPostModel.create).toHaveBeenCalledWith({
        ...createPostDto,
        author: userId,
      });
    });
  
    it('should handle errors when creating a post and log the error', async () => {
      const createPostDto: CreatePostDto = { title: 'New Post', content: 'Post content' };
      const userId = 'user123';
      const errorMessage = 'Mocked error';
  
      mockPostModel.create.mockRejectedValue(new Error(errorMessage));
  
      await expect(postService.create(createPostDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to create post for user ${userId}: ${errorMessage}`);
    });
  });
  

  describe('findAll', () => {
    beforeEach(() => {
      jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should fetch all posts successfully', async () => {
      const posts = [{ title: 'Post 1' }, { title: 'Post 2' }];
      mockPostModel.find.mockResolvedValue(posts);
  
      const result = await postService.findAll();
  
      expect(result).toEqual(posts);
      expect(postService['logger'].log).toHaveBeenCalledWith('Successfully fetched all posts');
    });
  
    it('should handle errors when fetching posts', async () => {
      mockPostModel.find.mockRejectedValue(new Error('Mocked error'));
  
      await expect(postService.findAll()).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith('Failed to fetch posts');
    });
  });
  

  describe('findOne', () => {
    beforeEach(() => {
      jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should find a post by ID successfully and log the event', async () => {
      const postId = 'post123';
      const post = { title: 'Existing Post', content: 'Post content', _id: postId };
  
      mockPostModel.findById.mockResolvedValue(post);
  
      const result = await postService.findOne(postId);
  
      expect(result).toEqual(post);
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully fetched post with ID ${postId}`);
      expect(mockPostModel.findById).toHaveBeenCalledWith(postId);
    });
  
    it('should throw NotFoundException if post is not found and log a warning', async () => {
      const postId = 'post123';
  
      mockPostModel.findById.mockResolvedValue(null);
  
      await expect(postService.findOne(postId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found`);
    });
  
    it('should handle errors when finding a post and log the error', async () => {
      const postId = 'post123';
      const errorMessage = 'Mocked error';
  
      mockPostModel.findById.mockRejectedValue(new Error(errorMessage));
  
      await expect(postService.findOne(postId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to fetch post with ID ${postId}: ${errorMessage}`);
    });
  });
  

  describe('update', () => {
    beforeEach(() => {
      jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should update a post by ID and user and log the success', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post', content: 'Updated content' };
      const updatedPost = { ...updatePostDto, _id: postId, author: userId };
  
      mockPostModel.findOneAndUpdate.mockResolvedValue(updatedPost);
  
      const result = await postService.update(postId, updatePostDto, userId);
  
      expect(result).toEqual(updatedPost);
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully updated post with ID ${postId} by user ${userId}`);
      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: postId, author: userId },
        updatePostDto,
        { new: true }
      );
    });
  
    it('should throw NotFoundException if post is not found or not owned by user and log a warning', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post', content: 'Updated content' };
  
      mockPostModel.findOneAndUpdate.mockResolvedValue(null);
  
      await expect(postService.update(postId, updatePostDto, userId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found or not owned by user ${userId}`);
    });
  
    it('should handle errors when updating a post and log the error', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const updatePostDto: UpdatePostDto = { title: 'Updated Post', content: 'Updated content' };
      const errorMessage = 'Mocked error';
  
      mockPostModel.findOneAndUpdate.mockRejectedValue(new Error(errorMessage));
  
      await expect(postService.update(postId, updatePostDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to update post with ID ${postId}: ${errorMessage}`);
    });
  });
  

  describe('delete', () => {
    beforeEach(() => {
      jest.spyOn(postService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(postService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should delete a post by ID and user and log the success', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const result = { _id: postId, author: userId };
  
      mockPostModel.findOneAndDelete.mockResolvedValue(result);
  
      await postService.delete(postId, userId);
  
      expect(postService['logger'].log).toHaveBeenCalledWith(`Successfully deleted post with ID ${postId} by user ${userId}`);
      expect(mockPostModel.findOneAndDelete).toHaveBeenCalledWith({ _id: postId, author: userId });
    });
  
    it('should throw NotFoundException if post is not found or not owned by user and log a warning', async () => {
      const postId = 'post123';
      const userId = 'user123';
  
      mockPostModel.findOneAndDelete.mockResolvedValue(null);
  
      await expect(postService.delete(postId, userId)).rejects.toThrow(NotFoundException);
      expect(postService['logger'].warn).toHaveBeenCalledWith(`Post with ID ${postId} not found or not owned by user ${userId}`);
    });
  
    it('should handle errors when deleting a post and log the error', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const errorMessage = 'Mocked error';
  
      mockPostModel.findOneAndDelete.mockRejectedValue(new Error(errorMessage));
  
      await expect(postService.delete(postId, userId)).rejects.toThrow(InternalServerErrorException);
      expect(postService['logger'].error).toHaveBeenCalledWith(`Failed to delete post with ID ${postId}: ${errorMessage}`);
    });
  });  
});
