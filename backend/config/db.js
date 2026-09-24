import 'dotenv/config';
import mongoose from 'mongoose';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetsphere';
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
