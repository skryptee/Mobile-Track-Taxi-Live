import { connectDB } from '@/lib/db';
import { Driver } from '@/lib/models/Driver';
import { Customer } from '@/lib/models/Customer';
import { Booking } from '@/lib/models/Booking';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const [drivers, customers, bookings] = await Promise.all([
      Driver.find({ isActive: true }),
      Customer.find({ isActive: true }),
      Booking.find(),
    ]);

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter((d) => d.status === 'available').length;
    const onTripDrivers = drivers.filter((d) => d.status === 'on_trip').length;
    const offlineDrivers = drivers.filter((d) => d.status === 'offline').length;

    const totalCustomers = customers.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'completed').length;
    const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
    const ongoingBookings = bookings.filter((b) => b.status === 'ongoing').length;
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;

    const totalRevenue = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.finalFare || b.estimatedFare || 0), 0);

    // Weekly data (simplified - last 7 days)
    const today = new Date();
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayBookings = bookings.filter(
        (b) => new Date(b.createdAt) >= dayStart && new Date(b.createdAt) <= dayEnd
      );
      const dayRevenue = dayBookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.finalFare || b.estimatedFare || 0), 0);

      weekData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRevenue,
        bookings: dayBookings.length,
      });
    }

    return NextResponse.json({
      drivers: {
        total: totalDrivers,
        available: availableDrivers,
        onTrip: onTripDrivers,
        offline: offlineDrivers,
      },
      customers: {
        total: totalCustomers,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        ongoing: ongoingBookings,
        confirmed: confirmedBookings,
      },
      revenue: {
        total: totalRevenue,
      },
      weeklyData: weekData,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
