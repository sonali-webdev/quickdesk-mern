import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1); // no point running an API without its database
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});