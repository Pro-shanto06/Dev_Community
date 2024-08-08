import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: Model<User>;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(authService.login({ email: 'test@example.com', password: 'password' }))
        .rejects
        .toThrow(new NotFoundException('User not found'));
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'test@example.com', password: 'hashedpassword' } as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects
        .toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should return access token if login is successful', async () => {
        const user = {
          email: 'test@example.com',
          password: 'hashedpassword',
          _id: 'userId',
          toObject: jest.fn().mockReturnValue({
            email: 'test@example.com',
            _id: 'userId',
          }),
        } as any;
        
        mockUserModel.findOne.mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('token');
      
        const result = await authService.login({ email: 'test@example.com', password: 'password' });
      
        expect(result).toEqual({
          message: 'User logged in successfully',
          access_token: 'token',
        });
        expect(mockJwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user._id });
      });
      
  });
});
