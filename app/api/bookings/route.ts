import { connectDB } from '@/lib/db';
import { Booking } from '@/lib/models/Booking';
import { Customer } from '@/lib/models/Customer';
import { NextRequest, NextResponse } from 'next/server';

function generateBookingId(): string {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const bookings = await Booking.find()
      .populate('customerId', 'name phone email')
      .populate('driverId', 'name phone vehicleNumber vehicleType')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    
    console.log('[v0] POST /api/bookings - received data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }
    if (!data.pickupLocation) {
      return NextResponse.json({ error: 'Pickup location is required' }, { status: 400 });
    }
    if (!data.dropoffLocation) {
      return NextResponse.json({ error: 'Drop location is required' }, { status: 400 });
    }
    
    // Calculate fare - ensure it's a valid number, default to 0 if not
    const estimatedFare = parseFloat(data.estimatedFare) || parseFloat(data.fare) || 0;
    
    // Create booking with proper field mapping
    const bookingData = {
      bookingId: generateBookingId(),
      customerId: data.customerId,
      driverId: data.driverId || undefined,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      bookingType: data.bookingType || 'local',
      vehicleType: data.vehicleType || 'sedan',
      acType: data.acType || 'ac',
      estimatedDistance: parseFloat(data.estimatedDistance) || undefined,
      estimatedFare: estimatedFare,
      pickupTime: data.pickupTime ? new Date(data.pickupTime) : new Date(),
      notes: data.notes || undefined,
      whatsappPhone: data.whatsappPhone || undefined,
      paymentMethod: data.paymentMethod || 'cash',
      paymentStatus: data.paymentStatus || 'pending',
      status: 'pending',
    };
    
    console.log('[v0] Creating booking with data:', JSON.stringify(bookingData, null, 2));

    const booking = await Booking.create(bookingData);

    // Update customer's total bookings count
    await Customer.findByIdAndUpdate(data.customerId, {
      $inc: { totalBookings: 1 },
    });

    // Populate and return the created booking
    await booking.populate('customerId', 'name phone email');
    if (booking.driverId) {
      await booking.populate('driverId', 'name phone vehicleNumber vehicleType');
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
