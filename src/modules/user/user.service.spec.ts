import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SkillDto } from './dto/skill.dto';
import { ExperienceDto } from './dto/experience.dto';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken('User'));

    jest.spyOn(service['logger'], 'log').mockImplementation(jest.fn());
    jest.spyOn(service['logger'], 'warn').mockImplementation(jest.fn());
    jest.spyOn(service['logger'], 'error').mockImplementation(jest.fn());
  });

  describe('create', () => {
    it('should create a new user successfully and log the event', async () => {
      const createUserDto: CreateUserDto = {
        fname: 'John',
        lname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const createdUser = { ...createUserDto, _id: 'someId' } as User;
      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockUserModel, 'create').mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(createdUser);
      expect(service['logger'].log).toHaveBeenCalledWith(`User created successfully`);
    });

    it('should throw ConflictException if email already in use and log the warning', async () => {
      const createUserDto: CreateUserDto = {
        fname: 'John',
        lname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue({} as User);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`Email already in use`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      const createUserDto: CreateUserDto = {
        fname: 'John',
        lname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockUserModel, 'create').mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error creating user: Database error');
    });
  });

  describe('getAll', () => {
    it('should retrieve all users successfully and log the event', async () => {
      const users = [{ _id: 'someId', fname: 'John', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' }] as User[];
      jest.spyOn(mockUserModel, 'find').mockResolvedValue(users);

      const result = await service.getAll();
      expect(result).toEqual(users);
      expect(service['logger'].log).toHaveBeenCalledWith(`Retrieved users successfully`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'find').mockRejectedValue(new Error('Database error'));

      await expect(service.getAll()).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error retrieving users: Database error');
    });
  });

  describe('findById', () => {
 
    it('should find a user by ID successfully and log the event', async () => {
      const userId = 'user123'
      const user = { _id: userId, fname: 'John', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' } as User;
      mockUserModel.findById.mockResolvedValue(user);

      const result = await service.findById(userId);
      expect(result).toEqual(user);
      expect(service['logger'].log).toHaveBeenCalledWith(`User ID found successfully`);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

   
    describe('findById', () => {
      it('should throw NotFoundException if user not found and log a warning', async () => {
        const userId = 'user123';
        
        mockUserModel.findById.mockResolvedValue(null);
        
        await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    
        expect(service['logger'].warn).toHaveBeenCalledWith(`User ID not found`);
      });
    
    });
    

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(service.findById('someId')).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error finding user: Database error');
    });
  });

  describe('update', () => {
    it('should update a user successfully and log the event', async () => {
      const updateUserDto: UpdateUserDto = { fname: 'Jane' };
      const updatedUser = { _id: 'someId', fname: 'Jane', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' } as User;
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

      const result = await service.update('someId', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service['logger'].log).toHaveBeenCalledWith(`User ID updated successfully`);
    });

    it('should throw ConflictException if update contains restricted fields and log a warning', async () => {
      const updateUserDto: UpdateUserDto = { fname: 'Jane', password: 'newpassword', skills: [], experiences: [] };
      
      await expect(service.update('someId', updateUserDto)).rejects.toThrow(ConflictException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`Attempt to update restricted fields`);
    });

    it('should throw NotFoundException if user not found for update and log the warning', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(service.update('someId', { fname: 'Jane' })).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`User ID not found for update`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockRejectedValue(new Error('Database error'));

      await expect(service.update('someId', { fname: 'Jane' })).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error updating user: Database error');
    });
  });

  describe('delete', () => {
    it('should delete a user successfully and log the event', async () => {
      const result = { _id: 'someId', fname: 'John', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' } as User;
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(result);

      await service.delete('someId');
      expect(service['logger'].log).toHaveBeenCalledWith(`User ID deleted successfully`);
    });

    it('should throw NotFoundException if user not found for deletion and log the warning', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(null);

      await expect(service.delete('someId')).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`User ID not found for deletion`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockRejectedValue(new Error('Database error'));

      await expect(service.delete('someId')).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error deleting user: Database error');
    });
  });

  describe('changePassword', () => {
    it('should successfully change the password and log the event', async () => {
      const id = 'someId';
      const currentPassword = 'currentPassword123!';
      const newPassword = 'newPassword123!';
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const user = {
        _id: id,
        password: hashedCurrentPassword,
        save: jest.fn(),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (password) => password === currentPassword);

      const updatedUser = await service.changePassword(id, currentPassword, newPassword);
      expect(updatedUser.password).toEqual(newPassword); // This verifies the password was set correctly
      expect(service['logger'].log).toHaveBeenCalledWith(`User password updated successfully`);
    });

    it('should throw ConflictException if new password is the same as current password', async () => {
      const id = 'someId';
      const currentPassword = 'currentPassword123!';
      const newPassword = 'currentPassword123!'; // Same as current
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const user = {
        _id: id,
        password: hashedCurrentPassword,
        save: jest.fn(),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (password) => password === currentPassword);

      await expect(service.changePassword(id, currentPassword, newPassword))
        .rejects
        .toThrow(new ConflictException('New password cannot be the same as the current password'));
    });

    it('should throw ConflictException if current password is incorrect', async () => {
      const id = 'someId';
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword123!';
      const hashedCurrentPassword = await bcrypt.hash('currentPassword123!', 12);
      const user = {
        _id: id,
        password: hashedCurrentPassword,
        save: jest.fn(),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async (password) => password === 'currentPassword123!');

      await expect(service.changePassword(id, currentPassword, newPassword))
        .rejects
        .toThrow(new ConflictException('Current password is incorrect'));
    });

    it('should throw NotFoundException if user is not found', async () => {
      const id = 'someId';
      const currentPassword = 'currentPassword123!';
      const newPassword = 'newPassword123!';

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null);

      await expect(service.changePassword(id, currentPassword, newPassword))
        .rejects
        .toThrow(new NotFoundException('User not found'));
    });

    it('should throw InternalServerErrorException if an error occurs', async () => {
      const id = 'someId';
      const currentPassword = 'currentPassword123!';
      const newPassword = 'newPassword123!';

      jest.spyOn(mockUserModel, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(service.changePassword(id, currentPassword, newPassword))
        .rejects
        .toThrow(new InternalServerErrorException('Error updating password'));
    });
  });


  describe('addSkill', () => {
    it('should add a new skill and return the updated user', async () => {
      const userId = 'someId';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Advanced' };

      const user = {
        _id: userId,
        skills: [],
        save: jest.fn().mockResolvedValue({
          _id: userId,
          skills: [skillDto],
        }),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);

      const result = await service.addSkill(userId, skillDto);
      expect(result.skills).toContain(skillDto);
      expect(result.skills.length).toBe(1);
      expect(service['logger'].log).toHaveBeenCalledWith('Skill added successfully');
    });

    it('should throw ConflictException if the skill already exists', async () => {
      const userId = 'someId';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Advanced' };

      const user = {
        _id: userId,
        skills: [skillDto],
        save: jest.fn().mockResolvedValue(this),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow(ConflictException);
      expect(service['logger'].warn).toHaveBeenCalledWith('Skill already exists for this user');
    });

    it('should throw NotFoundException if the user is not found', async () => {
      const userId = 'someId';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Advanced' };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith('User ID not found for adding skill');
    });
  })
  
  describe('addExperience', () => {
    it('should add a new experience and return the updated user', async () => {
      const userId = 'someId';
      const experienceDto: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-01-01'),
      };

      const user = {
        _id: userId,
        experiences: [],
        save: jest.fn().mockResolvedValue({
          _id: userId,
          experiences: [experienceDto],
        }),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);

      const result = await service.addExperience(userId, experienceDto);
      expect(result.experiences).toContainEqual(experienceDto);
      expect(result.experiences.length).toBe(1);
      expect(service['logger'].log).toHaveBeenCalledWith('Experience added successfully');
    });

    it('should throw ConflictException if the experience already exists', async () => {
      const userId = 'someId';
      const experienceDto: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-01-01'),
      };

      const user = {
        _id: userId,
        experiences: [experienceDto],
        save: jest.fn().mockResolvedValue(this),
      } as unknown as User;

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user);

      await expect(service.addExperience(userId, experienceDto)).rejects.toThrow(ConflictException);
      expect(service['logger'].warn).toHaveBeenCalledWith('Duplicate experience detected');
    });

    it('should throw NotFoundException if the user is not found', async () => {
      const userId = 'someId';
      const experienceDto: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-01-01'),
      };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null);

      await expect(service.addExperience(userId, experienceDto)).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith('User ID not found for adding experience');
    });
  });


  describe('updateSkill', () => {
    it('should update a skill and return the updated user', async () => {
      const userId = 'userId';
      const oldSkillName = 'JavaScript';
      const updatedSkillDto: SkillDto = { name: 'TypeScript', level: 'Expert' };

      const user = {
        _id: userId,
        skills: [{ name: oldSkillName, level: 'Intermediate' }],
        save: jest.fn().mockResolvedValue({
          _id: userId,
          skills: [updatedSkillDto],
        }),
      };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user as any);

      const updatedUser = await service.updateSkill(userId, oldSkillName, updatedSkillDto);
      expect(updatedUser.skills[0]).toEqual(updatedSkillDto);
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      const userId = 'userId';
      const skillName = 'JavaScript';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Expert' };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(null);

      await expect(service.updateSkill(userId, skillName, skillDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the skill to update does not exist', async () => {
      const userId = 'userId';
      const oldSkillName = 'JavaScript';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Expert' };

      const user = {
        _id: userId,
        skills: [{ name: 'Python', level: 'Intermediate' }],
        save: jest.fn().mockResolvedValue({
          _id: userId,
          skills: [skillDto],
        }),
      };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user as any);

      await expect(service.updateSkill(userId, oldSkillName, skillDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if the updated skill name already exists', async () => {
      const userId = 'userId';
      const oldSkillName = 'JavaScript';
      const updatedSkillDto: SkillDto = { name: 'Python', level: 'Expert' };

      const user = {
        _id: userId,
        skills: [
          { name: 'JavaScript', level: 'Intermediate' },
          { name: 'Python', level: 'Beginner' },
        ],
        save: jest.fn().mockResolvedValue({
          _id: userId,
          skills: [updatedSkillDto],
        }),
      };

      jest.spyOn(mockUserModel, 'findById').mockResolvedValue(user as any);

      await expect(service.updateSkill(userId, oldSkillName, updatedSkillDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if an unexpected error occurs', async () => {
      const userId = 'userId';
      const oldSkillName = 'JavaScript';
      const skillDto: SkillDto = { name: 'TypeScript', level: 'Expert' };

      jest.spyOn(mockUserModel, 'findById').mockRejectedValue(new Error('Unexpected error'));

      await expect(service.updateSkill(userId, oldSkillName, skillDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateExperience', () => {
    it('should successfully update experience', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const oldExperience: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      const newExperienceDto: ExperienceDto = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      const user = {
        _id: userId,
        experiences: [oldExperience],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(user as any);

      const result = await service.updateExperience(userId, oldExperience, newExperienceDto);

      expect(result).toBe(user);
      expect(user.experiences).toContainEqual(newExperienceDto);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const oldExperience: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      const newExperienceDto: ExperienceDto = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(service.updateExperience(userId, oldExperience, newExperienceDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw NotFoundException if experience to update is not found', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const oldExperience: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      const newExperienceDto: ExperienceDto = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      const user = {
        _id: userId,
        experiences: [], // No matching experience
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(user as any);

      await expect(service.updateExperience(userId, oldExperience, newExperienceDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw ConflictException if experience overlaps with an existing experience', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const oldExperience: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      const newExperienceDto: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-06-01'),
        endDate: new Date('2023-01-01'),
      };

      const user = {
        _id: userId,
        experiences: [
          oldExperience,
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: new Date('2022-01-01'),
            endDate: new Date('2022-12-31'),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(user as any);

      await expect(service.updateExperience(userId, oldExperience, newExperienceDto))
        .rejects
        .toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      const userId = '60d0fe4f5311236168a109ca';
      const oldExperience: ExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      const newExperienceDto: ExperienceDto = {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      jest.spyOn(userModel, 'findById').mockRejectedValue(new Error('Unexpected error'));

      await expect(service.updateExperience(userId, oldExperience, newExperienceDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });
});