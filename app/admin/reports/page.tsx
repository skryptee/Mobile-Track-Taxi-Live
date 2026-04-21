'use client';

import { useEffect, useState, useRef } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  Download, FileText, Calendar, Search, Filter, 
  TrendingUp, IndianRupee, Car, Star, Eye, X
} from 'lucide-react';
import useSWR from 'swr';
import { Invoice } from '@/components/Invoice';

interface Booking {
  _id: string;
  bookingId: string;
  customerId: { _id: string; name: string; phone: string; email?: string };
  driverId?: { _id: string; name: string; phone: string; vehicleNumber: string; vehicleType: string };
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  acType: string;
  estimatedFare: number;
  finalFare?: number;
  baseFare?: number;
  distanceCharge?: number;
  actualDistance?: number;
  estimatedDistance?: number;
  status: string;
  pickupTime: string;
  completionTime?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  rating?: number;
  createdAt?: string;
}

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageFare: number;
  topDrivers: Array<{ name: string; trips: number; earnings: number }>;
  weeklyData: Array<{ day: string; revenue: number; bookings: number }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReportsPage() {
  const { data: bookings = [] } = useSWR<Booking[]>('/api/bookings', fetcher);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
        
        setReportData({
          totalRevenue: data.revenue.total,
          totalBookings: data.bookings.total,
          completedBookings: data.bookings.completed,
          cancelledBookings: cancelledCount,
          averageFare: data.bookings.completed > 0 ? data.revenue.total / data.bookings.completed : 0,
          topDrivers: [],
          weeklyData: data.weeklyData,
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [bookings]);

  // Filter bookings for history
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.bookingId?.includes(searchTerm) ||
      booking.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange.from) {
      matchesDate = new Date(booking.pickupTime) >= new Date(dateRange.from);
    }
    if (dateRange.to && matchesDate) {
      matchesDate = new Date(booking.pickupTime) <= new Date(dateRange.to + 'T23:59:59');
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate filtered stats
  const filteredStats = {
    totalRevenue: filteredBookings.reduce((sum, b) => sum + (b.finalFare || b.estimatedFare || 0), 0),
    totalBookings: filteredBookings.length,
    completedBookings: filteredBookings.filter(b => b.status === 'completed').length,
    averageRating: (() => {
      const rated = filteredBookings.filter(b => b.rating);
      return rated.length > 0 ? rated.reduce((sum, b) => sum + (b.rating || 0), 0) / rated.length : 0;
    })(),
  };

  const handlePrintInvoice = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${selectedBooking?.bookingId}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Phone', 'Pickup', 'Drop', 'Distance', 'Fare', 'Status', 'Payment', 'Date'];
    const rows = filteredBookings.map(b => [
      b.bookingId,
      b.customerId?.name || '',
      b.customerId?.phone || '',
      b.pickupLocation,
      b.dropoffLocation,
      b.actualDistance || b.estimatedDistance || '',
      b.finalFare || b.estimatedFare,
      b.status,
      b.paymentStatus || 'pending',
      new Date(b.pickupTime).toLocaleDateString('en-IN'),
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openInvoice = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowInvoice(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & History</h1>
              <p className="text-muted-foreground mt-1">Analytics, booking history, and invoices</p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <IndianRupee size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">Rs.{reportData?.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Car size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold text-foreground">{reportData?.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">{reportData?.completedBookings} completed</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Fare</p>
                  <p className="text-2xl font-bold text-foreground">Rs.{reportData?.averageFare.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Star size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold text-foreground">
                    {filteredStats.averageRating.toFixed(1)}/5
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Trend (Last 7 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (Rs.)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Bookings by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: reportData?.completedBookings || 0 },
                      { name: 'Cancelled', value: reportData?.cancelledBookings || 0 },
                      { name: 'Other', value: Math.max(0, (reportData?.totalBookings || 0) - (reportData?.completedBookings || 0) - (reportData?.cancelledBookings || 0)) },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking History with Filters */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col gap-4 mb-6">
              <h2 className="text-lg font-semibold text-foreground">Booking History</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                </select>
                
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="From Date"
                />
                
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="To Date"
                />
              </div>

              {/* Filtered Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-muted-foreground">
                  Showing: <span className="font-medium text-foreground">{filteredBookings.length}</span> bookings
                </span>
                <span className="text-muted-foreground">
                  Total: <span className="font-medium text-green-600">Rs.{filteredStats.totalRevenue.toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Booking ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Fare</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.slice(0, 50).map((booking) => (
                      <tr key={booking._id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4 font-mono text-xs text-foreground">{booking.bookingId}</td>
                        <td className="py-3 px-4">
                          <div className="text-foreground">{booking.customerId?.name}</div>
                          <div className="text-xs text-muted-foreground">{booking.customerId?.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-foreground max-w-[150px] truncate">{booking.pickupLocation}</div>
                          <div className="text-xs text-muted-foreground max-w-[150px] truncate">to {booking.dropoffLocation}</div>
                        </td>
                        <td className="py-3 px-4 text-foreground text-xs">{formatDate(booking.pickupTime)}</td>
                        <td className="py-3 px-4">
                          <div className="text-foreground font-medium">Rs.{booking.finalFare || booking.estimatedFare}</div>
                          {booking.actualDistance && (
                            <div className="text-xs text-muted-foreground">{booking.actualDistance} km</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            booking.status === 'completed'
                              ? 'bg-green-500/10 text-green-600'
                              : booking.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {booking.rating ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star size={14} className="fill-yellow-500" />
                              {booking.rating}/5
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {booking.status === 'completed' && (
                            <button
                              onClick={() => openInvoice(booking)}
                              className="flex items-center gap-1 text-primary hover:underline text-xs"
                            >
                              <FileText size={14} />
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredBookings.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Showing first 50 results. Use filters to narrow down.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Modal */}
        {showInvoice && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Invoice - {selectedBooking.bookingId}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
                  >
                    <Download size={16} />
                    Print / Download
                  </button>
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="p-2 hover:bg-accent rounded-lg"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div ref={invoiceRef}>
                <Invoice 
                  booking={selectedBooking}
                  companyName="Taxi Service"
                  companyPhone="+91-XXXXXXXXXX"
                />
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
