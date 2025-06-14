import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Party from '../models/Party.js';
import User from '../models/User.js';

dotenv.config();

const seedParties = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('Admin user not found. Please run seed users first.');
      process.exit(1);
    }

    // Clear existing parties
    await Party.deleteMany({});
    console.log('Cleared existing parties');

    // Create seed parties
    const parties = [
      {
        name: 'ABC Corporation',
        description: 'Main corporate client',
        createdBy: adminUser._id
      },
      {
        name: 'XYZ Industries',
        description: 'Manufacturing partner',
        createdBy: adminUser._id
      },
      {
        name: 'Tech Solutions Ltd',
        description: 'Technology consulting',
        createdBy: adminUser._id
      },
      {
        name: 'Global Services Inc',
        description: 'International services provider',
        createdBy: adminUser._id
      }
    ];

    for (const partyData of parties) {
      const party = new Party(partyData);
      await party.save();
      console.log(`Created party: ${party.name}`);
    }

    console.log('Seed parties created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedParties();