import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const conn = await mongoose.connect(mongoUri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
