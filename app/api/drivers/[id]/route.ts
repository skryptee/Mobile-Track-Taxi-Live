import { connectDB } from '@/lib/db';
import { Driver } from '@/lib/models/Driver';
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
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver, { status: 200 });
  } catch (error) {
    console.error('Get driver error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver' },
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
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const data = await req.json();
    const driver = await Driver.findByIdAndUpdate(id, data, { new: true });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver, { status: 200 });
  } catch (error) {
    console.error('Update driver error:', error);
    return NextResponse.json(
      { error: 'Failed to update driver' },
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
      return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Driver deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json(
      { error: 'Failed to delete driver' },
      { status: 500 }
    );
  }
}
