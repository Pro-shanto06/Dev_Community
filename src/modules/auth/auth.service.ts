import { Injectable, UnauthorizedException, Logger, NotFoundException,InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/user/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ message: string; access_token: string, refresh_token: string }> {
    const { email, password } = loginDto;

    try {
      const user = await this.userModel.findOne({ email });
      
      if (!user) {
        this.logger.warn(`Login attempt failed: User not found with email ${email}`);
        throw new NotFoundException('User not found');
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`Login attempt failed: Invalid credentials for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { email: user.email, sub: user._id };
      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      await user.save();

      this.logger.log(`User ${email} logged in successfully`);
      
      return {
        message: 'User logged in successfully',
        access_token: token,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login attempt failed: ${error.message}`);
      throw new InternalServerErrorException('Error to login');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
        const payload = this.jwtService.verify(refreshToken);
        const user = await this.userModel.findById(payload.sub);

        if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
            this.logger.warn('Invalid refresh token');
            throw new UnauthorizedException('Invalid refresh token');
        }

        const newAccessToken = this.jwtService.sign({ email: user.email, sub: user._id });
        this.logger.log(`User ${user.email} refreshed their token successfully`);
        return { access_token: newAccessToken };
    } catch (error) {
        this.logger.warn('Invalid refresh token');
        throw new UnauthorizedException('Invalid refresh token');
    }
}

}
