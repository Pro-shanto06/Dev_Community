import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;
    const user = await this.userModel.findOne({ email });

    if (user) {
      this.logger.error(`User with email ${email} already exists`);
      throw new ConflictException('User already exists');
    }

    const newUser = new this.userModel(createUserDto);
    await newUser.save();
    this.logger.log(`User with email ${email} created successfully`);
    return newUser;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      this.logger.error(`User with ID ${id} not found`);
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User with ID ${id} found successfully`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!user) {
      this.logger.error(`User with ID ${id} not found for update`);
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User with ID ${id} updated successfully`);
    return user;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      this.logger.error(`User with ID ${id} not found for deletion`);
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User with ID ${id} deleted successfully`);
    return { message: 'User deleted successfully' };
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      this.logger.log(`Password validated for user with email ${email}`);
      return user;
    }
    this.logger.warn(`Invalid password attempt for email ${email}`);
    return null;
  }
}
