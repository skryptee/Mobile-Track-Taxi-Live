import { connectDB } from '@/lib/db';
import { Driver } from '@/lib/models/Driver';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const drivers = await Driver.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json(drivers, { status: 200 });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    
    const driver = await Driver.create(data);
    return NextResponse.json(driver, { status: 201 });
  } catch (error: any) {
    console.error('Create driver error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Driver with this phone or license number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
