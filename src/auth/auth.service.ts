import { Injectable, UnauthorizedException, Logger, NotFoundException,InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
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

  async login(loginDto: LoginDto): Promise<{ message: string; access_token: string }> {
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

      const { password: _, ...userData } = user.toObject();
      const payload = { email: userData.email, sub: userData._id };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User ${email} logged in successfully`);
      
      return {
        message: 'User logged in successfully',
        access_token: token,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login attempt failed: ${error.message}`);
      throw new InternalServerErrorException('Error to login');
    }
  }
}
