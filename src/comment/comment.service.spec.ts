import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';
import {
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('CommentService', () => {
  let commentService: CommentService;
  let commentModel: Model<Comment>;
  let postService: PostService;
  let userService: UserService;

  const mockCommentModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn().mockReturnThis(), 
    populate: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockPostService = {
    findOne: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getModelToken(Comment.name),
          useValue: mockCommentModel,
        },
        {
          provide: PostService,
          useValue: mockPostService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    commentModel = module.get<Model<Comment>>(getModelToken(Comment.name));
    postService = module.get<PostService>(PostService);
    userService = module.get<UserService>(UserService);
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(commentService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'error').mockImplementation(jest.fn());
    });

    it('should create a comment successfully and log the event', async () => {
      const createCommentDto: CreateCommentDto = { content: 'This is a comment' };
      const postId = 'post123';
      const userId = 'user123';
      const createdComment = { ...createCommentDto, post: postId, author: userId, _id: 'comment123' };

      mockPostService.findOne.mockResolvedValue({ _id: postId });
      mockUserService.findById.mockResolvedValue({ _id: userId });
      mockCommentModel.create.mockResolvedValue(createdComment);

      const result = await commentService.create(postId, createCommentDto, userId);

      expect(result).toEqual(createdComment);
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment created successfully');
      expect(mockCommentModel.create).toHaveBeenCalledWith({
        ...createCommentDto,
        post: postId,
        author: userId,
      });
    });

    it('should throw NotFoundException if post is not found and log a warning', async () => {
      const createCommentDto: CreateCommentDto = { content: 'This is a comment' };
      const postId = 'post123';
      const userId = 'user123';

      mockPostService.findOne.mockResolvedValue(null);

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Post not found');
    });

    it('should throw ForbiddenException if user is not found and log a warning', async () => {
      const createCommentDto: CreateCommentDto = { content: 'This is a comment' };
      const postId = 'post123';
      const userId = 'user123';

      mockPostService.findOne.mockResolvedValue({ _id: postId });
      mockUserService.findById.mockResolvedValue(null);

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User not found');
    });

    it('should handle errors when creating a comment and log the error', async () => {
      const createCommentDto: CreateCommentDto = { content: 'This is a comment' };
      const postId = 'post123';
      const userId = 'user123';
      const errorMessage = 'Mocked error';

      mockPostService.findOne.mockResolvedValue({ _id: postId });
      mockUserService.findById.mockResolvedValue({ _id: userId });
      mockCommentModel.create.mockRejectedValue(new Error(errorMessage));

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to create comment for post: ${errorMessage}`);
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      jest.spyOn(commentService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'error').mockImplementation(jest.fn());
    });

    it('should find a comment by ID successfully and return it', async () => {
      const commentId = 'comment123';
      const foundComment = { _id: commentId, content: 'This is a comment', author: { _id: 'user123' } };


      mockCommentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(foundComment),
      });

      const result = await commentService.findById(commentId);

      expect(result).toEqual(foundComment);
      expect(mockCommentModel.findById).toHaveBeenCalledWith(commentId);
    });

    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';

      mockCommentModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(commentService.findById(commentId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment with ID not found');
    });

    it('should handle errors when finding a comment by ID and log the error', async () => {
      const commentId = 'comment123';
      const errorMessage = 'Mocked error';

      mockCommentModel.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage)),
      });

      await expect(commentService.findById(commentId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to fetch comment: ${errorMessage}`);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      jest.spyOn(commentService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'error').mockImplementation(jest.fn());
    });

    it('should update a comment successfully and return the updated comment', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const updatedComment = { _id: commentId, author: userId, content: 'Updated content' };
    
      mockCommentModel.findById.mockResolvedValue({ _id: commentId, author: userId, content: 'Original content' });
      mockCommentModel.findByIdAndUpdate.mockResolvedValue(updatedComment);
    
      const result = await commentService.update(commentId, updateCommentDto, userId);
    
      expect(result).toEqual(updatedComment);
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment updated by user');
      expect(mockCommentModel.findByIdAndUpdate).toHaveBeenCalledWith(commentId, updateCommentDto, { new: true });
    });
    

    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };

      mockCommentModel.findById.mockResolvedValue(null);

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment ID not found');
    });

    it('should throw ForbiddenException if user is not the author of the comment and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const comment = { _id: commentId, author: 'anotherUser123', content: 'Original content' };

      mockCommentModel.findById.mockResolvedValue(comment);

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User is not allowed to update comment');
    });

    it('should handle errors when updating a comment and log the error', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const comment = { _id: commentId, author: userId, content: 'Original content' };
      const errorMessage = 'Mocked error';

      mockCommentModel.findById.mockResolvedValue(comment);
      mockCommentModel.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to update comment: ${errorMessage}`);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      jest.spyOn(commentService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(commentService['logger'], 'error').mockImplementation(jest.fn());
    });
  
    it('should delete a comment successfully and log the event', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const comment = { _id: commentId, author: userId, content: 'This is a comment' };
  
      mockCommentModel.findById.mockResolvedValue(comment);
      mockCommentModel.findByIdAndDelete.mockResolvedValue(undefined);
  
      await commentService.delete(commentId, userId);
  
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment deleted by user');
      expect(mockCommentModel.findById).toHaveBeenCalledWith(commentId);
      expect(mockCommentModel.findByIdAndDelete).toHaveBeenCalledWith(commentId);
    });
  
    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
  
      mockCommentModel.findById.mockResolvedValue(null);
  
      await expect(commentService.delete(commentId, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment not found');
    });
  
    it('should throw ForbiddenException if user is not the author of the comment and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const comment = { _id: commentId, author: 'anotherUser123', content: 'This is a comment' };
  
      mockCommentModel.findById.mockResolvedValue(comment);
  
      await expect(commentService.delete(commentId, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User is not allowed to delete comment');
    });
  
    it('should handle errors when deleting a comment and log the error', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const comment = { _id: commentId, author: userId, content: 'This is a comment' };
      const errorMessage = 'Mocked error';
  
      mockCommentModel.findById.mockResolvedValue(comment);
      mockCommentModel.findByIdAndDelete.mockRejectedValue(new Error(errorMessage));
  
      await expect(commentService.delete(commentId, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to delete comment: ${errorMessage}`);
    });
  });
  

});