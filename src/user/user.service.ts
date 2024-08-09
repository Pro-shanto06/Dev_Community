import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email });

      if (existingUser) {
        this.logger.warn(`Email ${createUserDto.email} already in use`);
        throw new ConflictException('Email already in use');
      }

      const newUser = await this.userModel.create(createUserDto);
      this.logger.log(`User created successfully: ${newUser.email}`);
      return newUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating user: ${error.message}`);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async getAll(): Promise<User[]> {
    try {
      const users = await this.userModel.find();
      this.logger.log(`Retrieved ${users.length} users successfully`);
      return users;
    } catch (error) {
      this.logger.error('Error retrieving users: ' + error.message);
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      this.logger.log(`User with ID ${id} found successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding user with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error finding user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
      if (!user) {
        this.logger.warn(`User with ID ${id} not found for update`);
        throw new NotFoundException('User not found');
      }
      this.logger.log(`User with ID ${id} updated successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating user with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const result = await this.userModel.findByIdAndDelete(id);
      if (!result) {
        this.logger.warn(`User with ID ${id} not found for deletion`);
        throw new NotFoundException('User not found');
      }
      this.logger.log(`User with ID ${id} deleted successfully`);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting user with ID ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error deleting user');
    }
  }
}
