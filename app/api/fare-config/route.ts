import { connectDB } from '@/lib/db';
import { FareConfig } from '@/lib/models/FareConfig';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const fareConfigs = await FareConfig.find().sort({ createdAt: -1 });
    return NextResponse.json(fareConfigs, { status: 200 });
  } catch (error) {
    console.error('Get fare configs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fare configs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    
    const fareConfig = await FareConfig.create(data);
    return NextResponse.json(fareConfig, { status: 201 });
  } catch (error) {
    console.error('Create fare config error:', error);
    return NextResponse.json(
      { error: 'Failed to create fare config' },
      { status: 500 }
    );
  }
}
