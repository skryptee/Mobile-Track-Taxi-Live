import { connectDB } from '@/lib/db';
import { FareConfig } from '@/lib/models/FareConfig';
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
      return NextResponse.json({ error: 'Invalid fare config ID' }, { status: 400 });
    }

    const fareConfig = await FareConfig.findById(id);
    if (!fareConfig) {
      return NextResponse.json({ error: 'Fare config not found' }, { status: 404 });
    }

    return NextResponse.json(fareConfig, { status: 200 });
  } catch (error) {
    console.error('Get fare config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fare config' },
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
      return NextResponse.json({ error: 'Invalid fare config ID' }, { status: 400 });
    }

    const data = await req.json();
    const fareConfig = await FareConfig.findByIdAndUpdate(id, data, { new: true });

    if (!fareConfig) {
      return NextResponse.json({ error: 'Fare config not found' }, { status: 404 });
    }

    return NextResponse.json(fareConfig, { status: 200 });
  } catch (error) {
    console.error('Update fare config error:', error);
    return NextResponse.json(
      { error: 'Failed to update fare config' },
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
      return NextResponse.json({ error: 'Invalid fare config ID' }, { status: 400 });
    }

    const fareConfig = await FareConfig.findByIdAndDelete(id);

    if (!fareConfig) {
      return NextResponse.json({ error: 'Fare config not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Fare config deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete fare config error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fare config' },
      { status: 500 }
    );
  }
}
