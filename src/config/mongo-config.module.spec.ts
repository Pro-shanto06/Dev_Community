import { Test, TestingModule } from '@nestjs/testing';
import { MongoModule } from './mongo.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';

describe('MongoModule', () => {
  let exitMock: jest.SpyInstance;
  let loggerLogMock: jest.SpyInstance;
  let loggerErrorMock: jest.SpyInstance;

  beforeEach(() => {
    exitMock = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exited with code: ${code}`);
    });

    loggerLogMock = jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    loggerErrorMock = jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    exitMock.mockRestore();
    loggerLogMock.mockRestore();
    loggerErrorMock.mockRestore();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should connect to MongoDB and log success', async () => {
    const mockUri = 'mongodb://localhost:27017/test';
    process.env.MONGO_URI = mockUri;

    jest.spyOn(mongoose, 'connect').mockResolvedValue(undefined as any);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), MongoModule],
    }).compile();

    const configService = module.get<ConfigService>(ConfigService);
    expect(configService.get('MONGO_URI')).toBe(mockUri);
    expect(loggerLogMock).toHaveBeenCalledWith('Successfully connected to MongoDB.');
  });

  it('should log an error and exit if MONGO_URI is not defined', async () => {
    delete process.env.MONGO_URI;

    try {
      await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), MongoModule],
      }).compile();
    } catch (e) {
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(loggerErrorMock).toHaveBeenCalledWith('MONGO_URI is not defined in the environment variables.');
    }
  });

  it('should log an error and exit if MongoDB connection fails', async () => {
    const mockUri = 'mongodb://localhost:27017/test';
    process.env.MONGO_URI = mockUri;
    const mockError = new Error('Connection error');

    jest.spyOn(mongoose, 'connect').mockRejectedValue(mockError);

    try {
      await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), MongoModule],
      }).compile();
    } catch (e) {
      expect(exitMock).toHaveBeenCalledWith(1);
      expect(loggerErrorMock).toHaveBeenCalledWith(`Failed to connect to MongoDB: ${mockError}`);
    }
  });
});
