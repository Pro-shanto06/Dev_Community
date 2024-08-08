import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';

const logger = new Logger('MongoModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');

        if (!uri) {
            logger.error('MONGO_URI is not defined in the environment variables.');
            process.exit(1);
          }
        
          try {
            await mongoose.connect(uri);
            logger.log('Successfully connected to MongoDB.');
          } catch (error) {
            logger.error(`Failed to connect to MongoDB: ${error}`);
            process.exit(1);
          }
        
          return {
            uri,
          };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MongoModule {}
