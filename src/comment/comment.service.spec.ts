import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Post } from '../post/schemas/post.schema';

describe('CommentService', () => {
  let commentService: CommentService;
  let mockCommentModel: Model<Comment>;
  let mockPostModel: Model<Post>;
  let mockPostService: PostService;
  let mockUserService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getModelToken('Comment'),
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
        {
          provide: getModelToken('Post'),
          useValue: {
            updateOne: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    mockCommentModel = module.get<Model<Comment>>(getModelToken('Comment'));
    mockPostModel = module.get<Model<Post>>(getModelToken('Post'));
    mockPostService = module.get<PostService>(PostService);
    mockUserService = module.get<UserService>(UserService);

    jest.spyOn(commentService['logger'], 'log').mockImplementation(jest.fn());
    jest.spyOn(commentService['logger'], 'warn').mockImplementation(jest.fn());
    jest.spyOn(commentService['logger'], 'error').mockImplementation(jest.fn());
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const post = { _id: postId };
      const user = { _id: userId };
      const newComment = { _id: 'comment123', ...createCommentDto, post: postId, author: userId };

      mockPostService.findOne = jest.fn().mockResolvedValue(post);
      mockUserService.findById = jest.fn().mockResolvedValue(user);
      mockCommentModel.create = jest.fn().mockResolvedValue(newComment);
      mockPostModel.updateOne = jest.fn().mockResolvedValue({});

      const result = await commentService.create(postId, createCommentDto, userId);

      expect(result).toEqual(newComment);
      expect(mockPostService.findOne).toHaveBeenCalledWith(postId);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockCommentModel.create).toHaveBeenCalledWith({
        ...createCommentDto,
        post: postId,
        author: userId,
      });
      expect(mockPostModel.updateOne).toHaveBeenCalledWith(
        { _id: postId },
        { $push: { comments: newComment._id } },
      );
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment created successfully');
    });

    it('should throw NotFoundException if post is not found', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };

      mockPostService.findOne = jest.fn().mockResolvedValue(null);

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Post not found');
    });

    it('should throw ForbiddenException if user is not found', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const post = { _id: postId };

      mockPostService.findOne = jest.fn().mockResolvedValue(post);
      mockUserService.findById = jest.fn().mockResolvedValue(null);

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User not found');
    });

    it('should log and throw InternalServerErrorException on unexpected error', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const createCommentDto: CreateCommentDto = { content: 'Test comment' };
      const errorMessage = 'Unexpected error';

      mockPostService.findOne = jest.fn().mockResolvedValue({ _id: postId });
      mockUserService.findById = jest.fn().mockResolvedValue({ _id: userId });
      mockCommentModel.create = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(commentService.create(postId, createCommentDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to create comment for post: ${errorMessage}`);
    });
  });

  describe('findById', () => {
    it('should find a comment by ID successfully and return it', async () => {
      const commentId = 'comment123';
      const foundComment = { _id: commentId, content: 'This is a comment', author: { _id: 'user123' } };

      mockCommentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(foundComment),
      });

      const result = await commentService.findById(commentId);

      expect(result).toEqual(foundComment);
      expect(mockCommentModel.findById).toHaveBeenCalledWith(commentId);
    });

    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';

      mockCommentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(commentService.findById(commentId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment with ID not found');
    });

    it('should handle errors when finding a comment by ID and log the error', async () => {
      const commentId = 'comment123';
      const errorMessage = 'Mocked error';

      mockCommentModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage)),
      });

      await expect(commentService.findById(commentId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to fetch comment: ${errorMessage}`);
    });
  });

  describe('update', () => {
    it('should update a comment successfully and return the updated comment', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const comment = { _id: commentId, author: userId, content: 'Original content' };
      const updatedComment = { _id: commentId, author: userId, content: 'Updated content' };

      mockCommentModel.findById = jest.fn().mockResolvedValue(comment);
      mockCommentModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedComment);

      const result = await commentService.update(commentId, updateCommentDto, userId);

      expect(result).toEqual(updatedComment);
      expect(mockCommentModel.findById).toHaveBeenCalledWith(commentId);
      expect(mockCommentModel.findByIdAndUpdate).toHaveBeenCalledWith(commentId, updateCommentDto, { new: true });
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment updated by user');
    });

    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };

      mockCommentModel.findById = jest.fn().mockResolvedValue(null);

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment ID not found');
    });

    it('should throw ForbiddenException if user is not the author and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const comment = { _id: commentId, author: 'anotherUserId' };

      mockCommentModel.findById = jest.fn().mockResolvedValue(comment);

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User is not allowed to update comment');
    });

    it('should log and throw InternalServerErrorException on unexpected error', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const updateCommentDto: UpdateCommentDto = { content: 'Updated content' };
      const errorMessage = 'Unexpected error';

      mockCommentModel.findById = jest.fn().mockResolvedValue({ _id: commentId, author: userId });
      mockCommentModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(commentService.update(commentId, updateCommentDto, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to update comment: ${errorMessage}`);
    });
  });
  describe('delete', () => {
    it('should delete a comment successfully', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const comment = { _id: commentId, author: userId };

      mockCommentModel.findById = jest.fn().mockResolvedValue(comment);
      mockCommentModel.findByIdAndDelete = jest.fn().mockResolvedValue(undefined);

      await commentService.delete(commentId, userId);

      expect(mockCommentModel.findById).toHaveBeenCalledWith(commentId);
      expect(mockCommentModel.findByIdAndDelete).toHaveBeenCalledWith(commentId);
      expect(commentService['logger'].log).toHaveBeenCalledWith('Comment deleted by user');
    });

    it('should throw NotFoundException if comment is not found and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';

      mockCommentModel.findById = jest.fn().mockResolvedValue(null);

      await expect(commentService.delete(commentId, userId)).rejects.toThrow(NotFoundException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('Comment not found');
    });

    it('should throw ForbiddenException if user is not the author and log a warning', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const comment = { _id: commentId, author: 'anotherUserId' };

      mockCommentModel.findById = jest.fn().mockResolvedValue(comment);

      await expect(commentService.delete(commentId, userId)).rejects.toThrow(ForbiddenException);
      expect(commentService['logger'].warn).toHaveBeenCalledWith('User is not allowed to delete comment');
    });

    it('should log and throw InternalServerErrorException on unexpected error', async () => {
      const commentId = 'comment123';
      const userId = 'user123';
      const errorMessage = 'Unexpected error';

      mockCommentModel.findById = jest.fn().mockResolvedValue({ _id: commentId, author: userId });
      mockCommentModel.findByIdAndDelete = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(commentService.delete(commentId, userId)).rejects.toThrow(InternalServerErrorException);
      expect(commentService['logger'].error).toHaveBeenCalledWith(`Failed to delete comment: ${errorMessage}`);
    });
  });
});
