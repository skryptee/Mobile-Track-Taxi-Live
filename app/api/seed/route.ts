import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/lib/models/Customer';
import { Driver } from '@/lib/models/Driver';
import { FareConfig } from '@/lib/models/FareConfig';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    console.log('[v0] Seeding database...');

    // Clear existing data
    await Customer.deleteMany({});
    await Driver.deleteMany({});
    await FareConfig.deleteMany({});

    // Create sample customers
    const customers = await Customer.insertMany([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '9876543210',
        address: 'Bangalore, India',
      },
      {
        name: 'Priya Singh',
        email: 'priya@example.com',
        phone: '9876543211',
        address: 'Delhi, India',
      },
      {
        name: 'Amit Patel',
        email: 'amit@example.com',
        phone: '9876543212',
        address: 'Mumbai, India',
      },
      {
        name: 'Sneha Sharma',
        email: 'sneha@example.com',
        phone: '9876543213',
        address: 'Pune, India',
      },
    ]);

    // Create sample drivers
    const drivers = await Driver.insertMany([
      {
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        phone: '9988776655',
        licenseNumber: 'DL-001-2024',
        vehicleNumber: 'KA-01-AB-1001',
        vehicleType: 'sedan',
        vehicleModel: 'Honda City',
        status: 'available',
        rating: 4.8,
      },
      {
        name: 'Arjun Reddy',
        email: 'arjun@example.com',
        phone: '9988776656',
        licenseNumber: 'DL-002-2024',
        vehicleNumber: 'KA-01-AB-1002',
        vehicleType: 'suv',
        vehicleModel: 'Mahindra XUV500',
        status: 'available',
        rating: 4.6,
      },
      {
        name: 'Mohit Verma',
        email: 'mohit@example.com',
        phone: '9988776657',
        licenseNumber: 'DL-003-2024',
        vehicleNumber: 'KA-01-AB-1003',
        vehicleType: 'mini',
        vehicleModel: 'Maruti Swift',
        status: 'available',
        rating: 4.7,
      },
    ]);

    // Create fare config
    await FareConfig.insertMany([
      {
        name: 'Sedan AC',
        description: 'Standard sedan with AC',
        vehicleType: 'sedan',
        acType: 'ac',
        baseRate: 50,
        perKmRate: 15,
        perMinuteRate: 2,
        minimumFare: 50,
        waitingChargePerMin: 1,
        peakHourMultiplier: 1.5,
        nightChargeMultiplier: 1.2,
      },
      {
        name: 'SUV AC',
        description: 'Premium SUV with AC',
        vehicleType: 'suv',
        acType: 'ac',
        baseRate: 80,
        perKmRate: 20,
        perMinuteRate: 3,
        minimumFare: 80,
        waitingChargePerMin: 1.5,
        peakHourMultiplier: 1.5,
        nightChargeMultiplier: 1.2,
      },
      {
        name: 'Mini AC',
        description: 'Economy mini with AC',
        vehicleType: 'mini',
        acType: 'ac',
        baseRate: 40,
        perKmRate: 12,
        perMinuteRate: 1.5,
        minimumFare: 40,
        waitingChargePerMin: 0.8,
        peakHourMultiplier: 1.5,
        nightChargeMultiplier: 1.2,
      },
    ]);

    console.log(`[v0] Seeded ${customers.length} customers, ${drivers.length} drivers, and 3 fare configs`);

    return NextResponse.json({
      message: 'Database seeded successfully',
      customers: customers.length,
      drivers: drivers.length,
      fareConfigs: 3,
    });
  } catch (error) {
    console.error('[v0] Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed database' },
      { status: 500 }
    );
  }
}
