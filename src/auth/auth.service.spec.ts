import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { NotFoundException, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';

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
     beforeEach(() => {
      jest.spyOn(authService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(authService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(authService['logger'], 'error').mockImplementation(jest.fn());
    });
    
    it('should return a token and message on successful login', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const user = { email: loginDto.email, password: await bcrypt.hash(loginDto.password, 10), toObject: () => ({ email: loginDto.email, _id: 'userId' }) };
      const token = 'mockedToken';
      
      jest.spyOn(userModel, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);
      jest.spyOn(authService['logger'], 'log').mockImplementation(jest.fn());

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        message: 'User logged in successfully',
        access_token: token,
      });
      expect(authService['logger'].log).toHaveBeenCalledWith(`User ${loginDto.email} logged in successfully`);
    });

    it('should throw NotFoundException if user is not found and log a warning', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(authService['logger'], 'warn').mockImplementation(jest.fn());

      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(authService['logger'].warn).toHaveBeenCalledWith(`Login attempt failed: User not found with email ${loginDto.email}`);
    });

    it('should throw UnauthorizedException if password is invalid and log a warning', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const user = { email: loginDto.email, password: await bcrypt.hash('wrongPassword', 10), toObject: () => ({ email: loginDto.email, _id: 'userId' }) };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      jest.spyOn(authService['logger'], 'warn').mockImplementation(jest.fn());

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService['logger'].warn).toHaveBeenCalledWith(`Login attempt failed: Invalid credentials for email ${loginDto.email}`);
    });

    it('should handle and log errors during the login process', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const errorMessage = 'Database error';

      jest.spyOn(userModel, 'findOne').mockRejectedValue(new Error(errorMessage));
      jest.spyOn(authService['logger'], 'error').mockImplementation(jest.fn());

      await expect(authService.login(loginDto)).rejects.toThrow(InternalServerErrorException);
      expect(authService['logger'].error).toHaveBeenCalledWith(`Login attempt failed: ${errorMessage}`);
    });
  });
});
