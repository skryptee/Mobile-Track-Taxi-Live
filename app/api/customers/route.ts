import { connectDB } from '@/lib/db';
import { Customer } from '@/lib/models/Customer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const customers = await Customer.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    
    const customer = await Customer.create(data);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Create customer error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
