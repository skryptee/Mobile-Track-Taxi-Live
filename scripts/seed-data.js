#!/usr/bin/env node

const mongoose = require('mongoose');

// Models
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, trim: true },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  licenseNumber: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleModel: { type: String },
  vehicleNumber: { type: String, required: true },
  acType: { type: String, default: 'ac' },
  yearsExperience: { type: Number, default: 0 },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'on_trip', 'offline', 'busy'], default: 'available' },
  isActive: { type: Boolean, default: true },
  joiningDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fareConfigSchema = new mongoose.Schema({
  baseFare: { type: Number, required: true },
  perKmFare: { type: Number, required: true },
  minimumFare: { type: Number, required: true },
  waitingChargePerMin: { type: Number, default: 0 },
  peakHourMultiplier: { type: Number, default: 1 },
  peakHourStart: { type: String },
  peakHourEnd: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);
const FareConfig = mongoose.models.FareConfig || mongoose.model('FareConfig', fareConfigSchema);

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }

    console.log('[v0] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    // Check if data already exists
    const customerCount = await Customer.countDocuments();
    const driverCount = await Driver.countDocuments();
    const fareConfigCount = await FareConfig.countDocuments();

    if (customerCount === 0) {
      console.log('[v0] Seeding sample customers...');
      const customers = await Customer.insertMany([
        {
          name: 'Raj Kumar',
          phone: '+919876543210',
          email: 'raj@example.com',
          address: '123 Main Street, Mumbai',
          isActive: true,
          rating: 4.5,
          totalBookings: 0,
          totalSpent: 0,
        },
        {
          name: 'Priya Singh',
          phone: '+919123456789',
          email: 'priya@example.com',
          address: '456 Park Avenue, Delhi',
          isActive: true,
          rating: 4.8,
          totalBookings: 0,
          totalSpent: 0,
        },
        {
          name: 'Ahmed Ali',
          phone: '+918765432109',
          email: 'ahmed@example.com',
          address: '789 Market Road, Bangalore',
          isActive: true,
          rating: 4.6,
          totalBookings: 0,
          totalSpent: 0,
        },
        {
          name: 'Sneha Desai',
          phone: '+917654321098',
          email: 'sneha@example.com',
          address: '321 Tech Park, Pune',
          isActive: true,
          rating: 4.7,
          totalBookings: 0,
          totalSpent: 0,
        },
      ]);
      console.log(`[v0] Created ${customers.length} sample customers`);
    } else {
      console.log(`[v0] Customers already exist (${customerCount}), skipping customer seed`);
    }

    if (driverCount === 0) {
      console.log('[v0] Seeding sample drivers...');
      const drivers = await Driver.insertMany([
        {
          name: 'Mohammad Iqbal',
          phone: '+919999888877',
          email: 'iqbal@example.com',
          licenseNumber: 'DL-2024-001',
          vehicleType: 'sedan',
          vehicleModel: 'Toyota Etios',
          vehicleNumber: 'KA-01-AB-1234',
          acType: 'ac',
          yearsExperience: 5,
          rating: 4.7,
          totalRatings: 120,
          status: 'available',
          totalEarnings: 0,
          isActive: true,
        },
        {
          name: 'Arjun Patel',
          phone: '+919888777666',
          email: 'arjun@example.com',
          licenseNumber: 'DL-2024-002',
          vehicleType: 'sedan',
          vehicleModel: 'Maruti Swift Dzire',
          vehicleNumber: 'MH-02-CD-5678',
          acType: 'ac',
          yearsExperience: 3,
          rating: 4.5,
          totalRatings: 85,
          status: 'available',
          totalEarnings: 0,
          isActive: true,
        },
        {
          name: 'Vikram Singh',
          phone: '+919777666555',
          email: 'vikram@example.com',
          licenseNumber: 'DL-2024-003',
          vehicleType: 'suv',
          vehicleModel: 'Hyundai Creta',
          vehicleNumber: 'TN-03-EF-9012',
          acType: 'ac',
          yearsExperience: 7,
          rating: 4.8,
          totalRatings: 200,
          status: 'available',
          totalEarnings: 0,
          isActive: true,
        },
        {
          name: 'Sandeep Kumar',
          phone: '+919666555444',
          email: 'sandeep@example.com',
          licenseNumber: 'DL-2024-004',
          vehicleType: 'sedan',
          vehicleModel: 'Honda Amaze',
          vehicleNumber: 'GJ-04-GH-3456',
          acType: 'ac',
          yearsExperience: 4,
          rating: 4.6,
          totalRatings: 95,
          status: 'available',
          totalEarnings: 0,
          isActive: true,
        },
      ]);
      console.log(`[v0] Created ${drivers.length} sample drivers`);
    } else {
      console.log(`[v0] Drivers already exist (${driverCount}), skipping driver seed`);
    }

    if (fareConfigCount === 0) {
      console.log('[v0] Seeding fare configuration...');
      await FareConfig.create({
        baseFare: 50,
        perKmFare: 15,
        minimumFare: 50,
        waitingChargePerMin: 2,
        peakHourMultiplier: 1.5,
        peakHourStart: '09:00',
        peakHourEnd: '23:00',
        isActive: true,
      });
      console.log('[v0] Fare configuration created');
    } else {
      console.log(`[v0] Fare configuration already exists, skipping`);
    }

    console.log('[v0] Seed complete!');
    console.log('[v0] You can now create bookings with the following customers:');
    const customers = await Customer.find({ isActive: true });
    customers.forEach((c) => {
      console.log(`  - ${c.name} (${c.phone})`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[v0] Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
