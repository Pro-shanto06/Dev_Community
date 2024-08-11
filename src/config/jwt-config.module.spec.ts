import { Test, TestingModule } from '@nestjs/testing';
import { JwtConfigModule } from './jwt.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('JwtConfigModule', () => {
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

  it('should load JWT_SECRET from environment variables', async () => {
    process.env.JWT_SECRET = 'testsecret';

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtConfigModule],
    }).compile();

    const configService = module.get<ConfigService>(ConfigService);
    expect(configService.get('JWT_SECRET')).toBe('testsecret');
  });

  it('should log an error and exit if JWT_SECRET is not defined', async () => {
    delete process.env.JWT_SECRET;

    try {
      await Test.createTestingModule({
        imports: [JwtConfigModule],
      }).compile();
    } catch (error) {
      expect(error.message).toBe('Process exited with code: 1');
    }

    expect(exitMock).toHaveBeenCalledWith(1);
    expect(loggerErrorMock).toHaveBeenCalledWith('JWT_SECRET is not defined in the environment variables.');
  });
});
