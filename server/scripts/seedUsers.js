import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create seed users
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@company.com'
      },
      {
        username: 'john',
        password: 'john123',
        role: 'user',
        name: 'John Doe',
        email: 'john@company.com'
      },
      {
        username: 'jane',
        password: 'jane123',
        role: 'user',
        name: 'Jane Smith',
        email: 'jane@company.com'
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.username}`);
    }

    console.log('Seed users created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();