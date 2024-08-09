import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

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
      expect(service['logger'].log).toHaveBeenCalledWith(`User created successfully: ${createdUser.email}`);
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
      expect(service['logger'].warn).toHaveBeenCalledWith(`Email ${createUserDto.email} already in use`);
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
      expect(service['logger'].log).toHaveBeenCalledWith(`Retrieved ${users.length} users successfully`);
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
      expect(service['logger'].log).toHaveBeenCalledWith(`User with ID ${userId} found successfully`);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

   
    describe('findById', () => {
      it('should throw NotFoundException if user not found and log a warning', async () => {
        const userId = 'user123';
        
        mockUserModel.findById.mockResolvedValue(null);
        
        await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    
        expect(service['logger'].warn).toHaveBeenCalledWith(`User with ID ${userId} not found`);
      });
    
    });
    

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(service.findById('someId')).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error finding user with ID someId: Database error');
    });
  });

  describe('update', () => {
    it('should update a user successfully and log the event', async () => {
      const updateUserDto: UpdateUserDto = { fname: 'Jane' };
      const updatedUser = { _id: 'someId', fname: 'Jane', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' } as User;
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

      const result = await service.update('someId', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service['logger'].log).toHaveBeenCalledWith(`User with ID someId updated successfully`);
    });

    it('should throw NotFoundException if user not found for update and log the warning', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(service.update('someId', { fname: 'Jane' })).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`User with ID someId not found for update`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockRejectedValue(new Error('Database error'));

      await expect(service.update('someId', { fname: 'Jane' })).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error updating user with ID someId: Database error');
    });
  });

  describe('delete', () => {
    it('should delete a user successfully and log the event', async () => {
      const result = { _id: 'someId', fname: 'John', lname: 'Doe', email: 'john.doe@example.com', password: 'password123' } as User;
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(result);

      await service.delete('someId');
      expect(service['logger'].log).toHaveBeenCalledWith(`User with ID someId deleted successfully`);
    });

    it('should throw NotFoundException if user not found for deletion and log the warning', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(null);

      await expect(service.delete('someId')).rejects.toThrow(NotFoundException);
      expect(service['logger'].warn).toHaveBeenCalledWith(`User with ID someId not found for deletion`);
    });

    it('should throw InternalServerErrorException if an error occurs and log the error', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockRejectedValue(new Error('Database error'));

      await expect(service.delete('someId')).rejects.toThrow(InternalServerErrorException);
      expect(service['logger'].error).toHaveBeenCalledWith('Error deleting user with ID someId: Database error');
    });
  });
});
