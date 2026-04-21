import { connectDB } from '@/lib/db';
import { Booking } from '@/lib/models/Booking';
import { Driver } from '@/lib/models/Driver';
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
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const booking = await Booking.findById(id)
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone vehicleNumber vehicleType vehicleModel rating');
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
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

    const { id } = await params;   // ✅ SAME as GET/DELETE
    const body = await req.json();

    console.log("🛠 ID:", id);
    console.log("🛠 BODY:", body);

    // ✅ VALIDATION
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Booking ID" },
        { status: 400 }
      );
    }

    // ✅ lifecycle tracking
    if (body.status === "ongoing") {
      body.tripStartTime = new Date();
    }

    if (body.status === "completed") {
  if (!body.actualDistance || body.actualDistance <= 0) {
    return NextResponse.json(
      { error: "Actual distance required" },
      { status: 400 }
    );
  }

  body.tripEndTime = new Date();
}
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    )
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone vehicleNumber vehicleType vehicleModel rating');

    if (!updatedBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log("✅ UPDATED STATUS:", updatedBooking.status);

    return NextResponse.json(updatedBooking, { status: 200 });

  } catch (error: any) {
    console.error("❌ BACKEND ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Server error" },
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
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // If booking had a driver and wasn't completed, free them up
    if (booking.driverId && booking.status !== 'completed') {
      await Driver.findByIdAndUpdate(booking.driverId, { status: 'available' });
    }

    await Booking.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Booking deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
