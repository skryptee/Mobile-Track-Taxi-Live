import { connectDB } from '@/lib/db';
import { Customer } from '@/lib/models/Customer';
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const data = await req.json();
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Customer deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
