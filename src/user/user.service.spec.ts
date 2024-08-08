import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;
    let model: Model<User>;


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getModelToken('User'),
                    useValue: {
                        create: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        findById: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                        findByIdAndDelete: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        model = module.get<Model<User>>(getModelToken('User'));

        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });

    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            const createUserDto: CreateUserDto = {
                fname: 'John',
                lname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            const user = {
                ...createUserDto,
                _id: 'some-id',
            };


            jest.spyOn(model, 'findOne').mockResolvedValue(null);
            jest.spyOn(model, 'create').mockResolvedValue(user as any);

            const result = await service.create(createUserDto);

            expect(result).toEqual(user);
            expect(model.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
            expect(model.create).toHaveBeenCalledWith(createUserDto);
        });

        it('should throw a ConflictException if email is already in use', async () => {
            const createUserDto: CreateUserDto = {
                fname: 'John',
                lname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            jest.spyOn(model, 'findOne').mockResolvedValue(createUserDto);

            await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
            expect(model.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
        });

        it('should throw an InternalServerErrorException if there is an error during user creation', async () => {
            const createUserDto: CreateUserDto = {
                fname: 'John',
                lname: 'Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            jest.spyOn(model, 'findOne').mockResolvedValue(null);
            jest.spyOn(model, 'create').mockRejectedValue(new Error() as any);

            await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
            expect(model.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
        });

    });

    describe('getAll', () => {
        it('should retrieve all users successfully', async () => {
            const users = [
                { _id: '1', fname: 'John', lname: 'Doe', email: 'john@example.com', phone: '1234567890', password: 'password123' },
                { _id: '2', fname: 'Jane', lname: 'Doe', email: 'jane@example.com', phone: '0987654321', password: 'password123' },
            ];

            jest.spyOn(model, 'find').mockResolvedValue(users as any);

            const result = await service.getAll();

            expect(result).toEqual(users);
            expect(model.find).toHaveBeenCalled();
        });

        it('should throw an error if there is an issue retrieving users', async () => {
            jest.spyOn(model, 'find').mockRejectedValue(new Error() as any);

            await expect(service.getAll()).rejects.toThrow(InternalServerErrorException);
            expect(model.find).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should retrieve a user by ID successfully', async () => {
            const userId = 'some-id';
            const user = { _id: userId, fname: 'John', lname: 'Doe', email: 'john@example.com', phone: '1234567890', password: 'password123' };

            jest.spyOn(model, 'findById').mockResolvedValue(user as any);

            const result = await service.findById(userId);

            expect(result).toEqual(user);
            expect(model.findById).toHaveBeenCalledWith(userId);
        });

        it('should throw a NotFoundException if user with the given ID is not found', async () => {
            const userId = 'some-id';

            jest.spyOn(model, 'findById').mockResolvedValue(null);

            await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
            expect(model.findById).toHaveBeenCalledWith(userId);
        });
    });

    describe('update', () => {
        it('should update a user successfully', async () => {
            const userId = 'some-id';
            const updateUserDto: UpdateUserDto = { fname: 'Jane', lname: 'Doe' };
            const updatedUser = { _id: userId, ...updateUserDto };

            jest.spyOn(model, 'findByIdAndUpdate').mockResolvedValue(updatedUser as any);

            const result = await service.update(userId, updateUserDto);

            expect(result).toEqual(updatedUser);
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateUserDto, { new: true });
        });

        it('should throw a NotFoundException if user with the given ID is not found for update', async () => {
            const userId = 'some-id';
            const updateUserDto: UpdateUserDto = { fname: 'Jane', lname: 'Doe' };

            jest.spyOn(model, 'findByIdAndUpdate').mockResolvedValue(null);

            await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateUserDto, { new: true });
        });
    });

    describe('delete', () => {
        it('should delete a user successfully', async () => {
            const userId = 'some-id';
            const deleteResult = { _id: userId };

            jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(deleteResult as any);

            const result = await service.delete(userId);

            expect(result).toEqual({ message: 'User deleted successfully' });
            expect(model.findByIdAndDelete).toHaveBeenCalledWith(userId);
        });

        it('should throw a NotFoundException if user with the given ID is not found for deletion', async () => {
            const userId = 'some-id';

            jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(null);

            await expect(service.delete(userId)).rejects.toThrow(NotFoundException);
            expect(model.findByIdAndDelete).toHaveBeenCalledWith(userId);
        });
    });
});
