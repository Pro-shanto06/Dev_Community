import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: Model<User>;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
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

    it('should return access and refresh tokens with a message on successful login', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);

      const user: Partial<User> = {
        email: loginDto.email,
        password: hashedPassword,
        refreshToken: '', 
        save: jest.fn().mockResolvedValue(this), 
      };

      const accessToken = 'mockedAccessToken';
      const refreshToken = 'mockedRefreshToken';

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockImplementation((payload, options?) => {
        if (options?.expiresIn === '7d') return refreshToken;
        return accessToken;
      });

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        message: 'User logged in successfully',
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(authService['logger'].log).toHaveBeenCalledWith(`User ${loginDto.email} logged in successfully`);
    });

    it('should throw NotFoundException if user is not found and log a warning', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
      expect(authService['logger'].warn).toHaveBeenCalledWith(`Login attempt failed: User not found with email ${loginDto.email}`);
    });

    it('should throw UnauthorizedException if password is invalid and log a warning', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash('wrongPassword', 10);

      const user: Partial<User> = {
        email: loginDto.email,
        password: hashedPassword,
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

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

  describe('refreshToken', () => {
    beforeEach(() => {
      jest.spyOn(authService['logger'], 'log').mockImplementation(jest.fn());
      jest.spyOn(authService['logger'], 'warn').mockImplementation(jest.fn());
      jest.spyOn(authService['logger'], 'error').mockImplementation(jest.fn());
    });

    it('should return a new access token on successful refresh', async () => {
      const refreshToken = 'validRefreshToken';
      const userId = 'userId123';
      const user = {
        _id: userId,
        email: 'test@example.com',
        refreshToken: await bcrypt.hash(refreshToken, 10),
      } as Partial<User>;

      const payload = { sub: userId, email: user.email };
      const newAccessToken = 'newAccessToken';

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userModel, 'findById').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(newAccessToken);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual({ access_token: newAccessToken });
      expect(authService['logger'].log).toHaveBeenCalledWith(`User ${user.email} refreshed their token successfully`);
    });

    it('should throw UnauthorizedException if the refresh token is invalid', async () => {
      const refreshToken = 'invalidRefreshToken';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(authService['logger'].warn).toHaveBeenCalledWith('Invalid refresh token');
    });

    it('should throw UnauthorizedException if the user is not found', async () => {
      const refreshToken = 'validRefreshToken';
      const payload = { sub: 'userId123' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(authService['logger'].warn).toHaveBeenCalledWith('Invalid refresh token');
    });

    it('should throw UnauthorizedException if the refresh token does not match', async () => {
      const refreshToken = 'validRefreshToken';
      const userId = 'userId123';
      const user = {
        _id: userId,
        email: 'test@example.com',
        refreshToken: await bcrypt.hash('differentRefreshToken', 10),
      } as Partial<User>;

      const payload = { sub: userId, email: user.email };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userModel, 'findById').mockResolvedValue(user as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      expect(authService['logger'].warn).toHaveBeenCalledWith('Invalid refresh token');
    });
  });
});
