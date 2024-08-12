import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { SkillDto } from './dto/skill.dto';
import { ExperienceDto } from './dto/experience.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email });

      if (existingUser) {
        this.logger.warn(`Email already in use`);
        throw new ConflictException('Email already in use');
      }

      const newUser = await this.userModel.create(createUserDto);
      this.logger.log(`User created successfully`);
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
      this.logger.log(`Retrieved users successfully`);
      return users;
    } catch (error) {
      this.logger.error(`Error retrieving users: ${error.message}`);
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        this.logger.warn(`User ID not found`);
        throw new NotFoundException(`User ID not found`);
      }
      this.logger.log(`User ID found successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding user: ${error.message}`);
      throw new InternalServerErrorException('Error finding user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const { password, skills, experiences, ...updateFields } = updateUserDto;
  
      if (password || skills || experiences) {
        this.logger.warn(`Attempt to update restricted fields`);
        throw new ConflictException('Update includes restricted fields');
      }
  
      const user = await this.userModel.findByIdAndUpdate(id, updateFields, { new: true });
      if (!user) {
        this.logger.warn(`User ID not found for update`);
        throw new NotFoundException('User not found');
      }
      this.logger.log(`User ID updated successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating user: ${error.message}`);
      throw new InternalServerErrorException('Error updating user');
    }
  }
  

  async delete(id: string): Promise<{ message: string }> {
    try {
      const result = await this.userModel.findByIdAndDelete(id);
      if (!result) {
        this.logger.warn(`User ID not found for deletion`);
        throw new NotFoundException('User not found');
      }
      this.logger.log(`User ID deleted successfully`);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting user: ${error.message}`);
      throw new InternalServerErrorException('Error deleting user');
    }
  }

  
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id);

      if (!user) {
        this.logger.warn(`User ID not found for password change`);
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        this.logger.warn(`Current password is incorrect`);
        throw new ConflictException('Current password is incorrect');
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        this.logger.warn(`New password cannot be the same as the current password`);
        throw new ConflictException('New password cannot be the same as the current password');
      }

      user.password = newPassword;
      await user.save();

      this.logger.log(`User password updated successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating password: ${error.message}`);
      throw new InternalServerErrorException('Error updating password');
    }
  }


  async addSkill(userId: string, skillDto: SkillDto): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        this.logger.warn(`User ID not found for adding skill`);
        throw new NotFoundException('User not found');
      }

      if (user.skills.some(skill => skill.name === skillDto.name)) {
        this.logger.warn(`Skill already exists for this user`);
        throw new ConflictException('Skill already exists');
      }

      user.skills.push(skillDto);
      await user.save();

      this.logger.log(`Skill added successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error adding skill: ${error.message}`);
      throw new InternalServerErrorException('Error adding skill');
    }
  }

  async addExperience(userId: string, experienceDto: ExperienceDto): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        this.logger.warn(`User ID not found for adding experience`);
        throw new NotFoundException('User not found');
      }

      const isDuplicate = user.experiences.some(exp => 
        exp.title === experienceDto.title && exp.company === experienceDto.company
      );

      if (isDuplicate) {
        this.logger.warn(`Duplicate experience detected`);
        throw new ConflictException('Experience with the same title and company already exists');
      }

      user.experiences.push(experienceDto);
      await user.save();

      this.logger.log(`Experience added successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error adding experience: ${error.message}`);
      throw new InternalServerErrorException('Error adding experience');
    }
  }


  async updateSkill(userId: string, skillName: string, skillDto: SkillDto): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
  
      if (!user) {
        this.logger.warn(`User ID not found for updating skill`);
        throw new NotFoundException('User not found');
      }
  
      const skillIndex = user.skills.findIndex(skill => skill.name === skillName);
      if (skillIndex === -1) {
        this.logger.warn(`Skill not found for update`);
        throw new NotFoundException('Skill not found');
      }

      if (user.skills.some(skill => skill.name === skillDto.name && skill.name !== skillName)) {
        this.logger.warn(`Skill name ${skillDto.name} already exists`);
        throw new ConflictException('Skill name already exists');
      }
  
      user.skills[skillIndex] = skillDto;
      await user.save();
  
      this.logger.log(`Skill updated successfully`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating skill: ${error.message}`);
      throw new InternalServerErrorException('Error updating skill');
    }
  }
  
  async updateExperience(userId: string, oldExperience: ExperienceDto, newExperienceDto: ExperienceDto): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found for updating experience`);
        throw new NotFoundException('User not found');
      }

      const experienceIndex = user.experiences.findIndex(exp => 
        exp.title === oldExperience.title && exp.company === oldExperience.company &&
        exp.startDate.getTime() === oldExperience.startDate.getTime() &&
        exp.endDate.getTime() === oldExperience.endDate.getTime()
      );

      if (experienceIndex === -1) {
        this.logger.warn(`Experience to update not found for user ${userId}`);
        throw new NotFoundException('Experience to update not found');
      }

      const isConflict = user.experiences.some(exp => 
        exp.title === newExperienceDto.title && 
        exp.company === newExperienceDto.company &&
        (newExperienceDto.startDate < exp.endDate && newExperienceDto.endDate > exp.startDate)
      );

      if (isConflict) {
        this.logger.warn(`Conflict detected with the new experience details for user ${userId}`);
        throw new ConflictException('Experience overlaps with an existing experience');
      }

    
      user.experiences[experienceIndex] = newExperienceDto;
      await user.save();

      this.logger.log(`Experience updated successfully for user ${userId}`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating experience for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Error updating experience');
    }
  }


  async updateProfilePic(userId: string, file: Express.Multer.File): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join('uploads', fileName);

      // Save the file to the `uploads` directory
      fs.writeFileSync(filePath, file.buffer);

      user.profilePic = filePath;
      await user.save();

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error updating profile picture');
    }
  }

}
