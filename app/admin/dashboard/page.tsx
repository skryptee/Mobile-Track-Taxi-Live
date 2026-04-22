'use client';

import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, Calendar, TrendingUp, MessageCircle, RefreshCw } from 'lucide-react';
import useSWR from 'swr';
import { openWhatsApp, generateBookingCreatedMessage } from '@/lib/whatsapp';
import Footer from '@/components/Footer';
interface Booking {
  _id: string;
  bookingId: string;
  customerId: { name: string; phone: string };
  driverId?: { name: string; phone: string; vehicleNumber: string };
  pickupLocation: string;
  dropoffLocation: string;
  estimatedFare: number;
  finalFare?: number;
  status: string;
  vehicleType: string;
  acType: string;
  pickupTime: string;
}

interface Stats {
  drivers: {
    total: number;
    available: number;
    onTrip: number;
    offline: number;
  };
  customers: {
    total: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    ongoing: number;
    confirmed: number;
  };
  revenue: {
    total: number;
  };
  weeklyData: Array<{
    day: string;
    revenue: number;
    bookings: number;
  }>;
}

const COLORS = ['#3b82f6', '#f59e0b', '#6b7280'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useSWR<Stats>('/api/stats', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });
  const { data: recentBookings = [], isLoading: bookingsLoading } = useSWR<Booking[]>('/api/bookings', fetcher, {
    refreshInterval: 30000,
  });

  const sendBookingWhatsApp = (booking: Booking) => {
    if (!booking.customerId?.phone) return;
    const message = generateBookingCreatedMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.estimatedFare,
        pickupTime: booking.pickupTime,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Failed to load stats</div>
      </div>
    );
  }

  const driverStatusData = [
    { name: 'Available', value: stats.drivers.available },
    { name: 'On Trip', value: stats.drivers.onTrip },
    { name: 'Offline', value: stats.drivers.offline },
  ];

  // Get latest 5 bookings
  const latestBookings = recentBookings.slice(0, 5);

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome to Mobile Track Taxi Admin</p>
            </div>
            <button
              onClick={() => mutateStats()}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Drivers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.drivers.total}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.drivers.available} available, {stats.drivers.onTrip} on trip
                  </p>
                </div>
                <UserCheck className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.customers.total}</p>
                  <p className="text-xs text-muted-foreground mt-2">Registered users</p>
                </div>
                <Users className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.bookings.total}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.bookings.completed} completed, {stats.bookings.pending + stats.bookings.ongoing} active
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-amber-500 opacity-20" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-foreground mt-2">Rs.{stats.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">From completed bookings</p>
                </div>
                <TrendingUp className="w-12 h-12 text-emerald-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.bookings.pending}</p>
              <p className="text-sm text-yellow-700">Pending</p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-cyan-600">{stats.bookings.confirmed}</p>
              <p className="text-sm text-cyan-700">Confirmed</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.bookings.ongoing}</p>
              <p className="text-sm text-blue-700">Ongoing</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.bookings.completed}</p>
              <p className="text-sm text-green-700">Completed</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Weekly Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (Rs.)" />
                  <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="Bookings" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Driver Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={driverStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {driverStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Bookings</h2>
              <a href="/admin/bookings" className="text-sm text-primary hover:underline">View All</a>
            </div>
            {bookingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
            ) : latestBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Booking ID</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Driver</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fare</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4 text-foreground font-mono text-xs">{booking.bookingId}</td>
                        <td className="py-3 px-4 text-foreground">{booking.customerId?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-foreground">{booking.driverId?.name || '-'}</td>
                        <td className="py-3 px-4 text-foreground text-xs">
                          <div>{booking.pickupLocation}</div>
                          <div className="text-muted-foreground">to {booking.dropoffLocation}</div>
                        </td>
                        <td className="py-3 px-4 text-foreground">Rs.{booking.finalFare || booking.estimatedFare}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            booking.status === 'completed'
                              ? 'bg-green-500/10 text-green-600'
                              : booking.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : booking.status === 'confirmed'
                              ? 'bg-cyan-500/10 text-cyan-600'
                              : booking.status === 'ongoing'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-red-500/10 text-red-600'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => sendBookingWhatsApp(booking)}
                            className="p-1.5 hover:bg-accent rounded transition-colors"
                            title="Send WhatsApp"
                          >
                            <MessageCircle size={18} className="text-green-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* WhatsApp Integration Info */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <MessageCircle size={18} />
              WhatsApp Integration Active
            </h3>
            <p className="text-sm text-green-600">
              Automatic WhatsApp notifications are enabled for: Booking Created, Booking Confirmed, Driver Assigned, Trip Started, and Trip Completed with detailed fare breakdown.
            </p>
          </div>
        </div>
        <Footer/>
      </AdminLayout>
    </>
  );
}
