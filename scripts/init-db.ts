#!/usr/bin/env node

import mongoose from 'mongoose';
import { Admin } from '../lib/models/Admin';
import { hashPassword } from '../lib/auth';

async function initializeApp() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taxidispatch.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
    } else {
      const hashedPassword = await hashPassword(adminPassword);
      const admin = await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Admin',
        role: 'super_admin',
      });
      console.log('Admin user created:', adminEmail);
      console.log('Password:', adminPassword);
    }

    console.log('Initialization complete!');
    console.log('\nYou can now login with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

initializeApp();
