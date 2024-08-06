import { MongooseModuleOptions } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';

export const getMongoConfig = async (): Promise<MongooseModuleOptions> => {
  const logger = new Logger('Mongoose');
  const uri = process.env.MONGO_URI;

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
};
