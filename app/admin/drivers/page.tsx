'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Edit2, Trash2, Plus, Search, Star, Car, Phone, 
  MapPin, TrendingUp, Clock, CheckCircle, XCircle,
  Activity, IndianRupee
} from 'lucide-react';
import useSWR from 'swr';

import Footer from '@/components/Footer';

interface Driver {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleModel?: string;
  vehicleType: string;
  status: 'available' | 'on_trip' | 'offline' | 'busy';
  currentLocation?: {
    address?: string;
    updatedAt?: string;
  };
  rating: number;
  totalTrips: number;
  totalRatings: number;
  totalEarnings: number;
  currentBookingId?: string;
  isActive: boolean;
  joiningDate?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DriversPage() {
  const { data: drivers = [], isLoading, mutate } = useSWR<Driver[]>('/api/drivers', fetcher);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleType: 'sedan',
    status: 'offline',
  });

  // Calculate stats
  const availableCount = drivers.filter(d => d.status === 'available').length;
  const onTripCount = drivers.filter(d => d.status === 'on_trip').length;
  const offlineCount = drivers.filter(d => d.status === 'offline' || d.status === 'busy').length;
  const totalEarnings = drivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      vehicleNumber: '',
      vehicleModel: '',
      vehicleType: 'sedan',
      status: 'offline',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        const response = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          mutate();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (driver: Driver) => {
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber,
      vehicleNumber: driver.vehicleNumber,
      vehicleModel: driver.vehicleModel || '',
      vehicleType: driver.vehicleType,
      status: driver.status,
    });
    setEditingId(driver._id);
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      available: { bg: 'bg-green-500/10', text: 'text-green-600', label: 'Available' },
      on_trip: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'On Trip' },
      offline: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Offline' },
      busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', label: 'Busy' },
    };
    return styles[status] || styles.offline;
  };

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
              <p className="text-muted-foreground mt-1">Manage drivers and their availability</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
              Add Driver
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{availableCount}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Car size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{onTripCount}</p>
                  <p className="text-sm text-muted-foreground">On Trip</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-500/5 border border-gray-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <XCircle size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{offlineCount}</p>
                  <p className="text-sm text-muted-foreground">Offline/Busy</p>
                </div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IndianRupee size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">Rs.{totalEarnings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingId ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Vehicle Number"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Vehicle Model (e.g., Swift Dzire)"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="mini">Mini</option>
                  <option value="auto">Auto</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="offline">Offline</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                </select>
                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {editingId ? 'Update Driver' : 'Add Driver'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, or vehicle number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="offline">Offline</option>
              <option value="busy">Busy</option>
            </select>
          </div>

          {/* Driver Cards (Mobile-friendly grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full p-6 text-center text-muted-foreground">Loading...</div>
            ) : filteredDrivers.length === 0 ? (
              <div className="col-span-full p-6 text-center text-muted-foreground">No drivers found</div>
            ) : (
              filteredDrivers.map((driver) => {
                const statusStyle = getStatusBadge(driver.status);
                return (
                  <div key={driver._id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {driver.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{driver.name}</h3>
                          <a 
                            href={`tel:${driver.phone}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} />
                            {driver.phone}
                          </a>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Car size={14} className="text-muted-foreground" />
                        <span className="text-foreground">
                          {driver.vehicleNumber} ({driver.vehicleType.toUpperCase()})
                        </span>
                      </div>
                      {driver.vehicleModel && (
                        <div className="text-xs text-muted-foreground ml-5">
                          {driver.vehicleModel}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-foreground">{driver.rating || 5}</span>
                          {driver.totalRatings > 0 && (
                            <span className="text-muted-foreground">({driver.totalRatings})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} className="text-muted-foreground" />
                          <span className="text-foreground">{driver.totalTrips} trips</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <IndianRupee size={14} className="text-green-600" />
                        <span className="text-green-600 font-medium">
                          Rs.{(driver.totalEarnings || 0).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">earned</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <select
                        value={driver.status}
                        onChange={(e) => handleStatusChange(driver._id, e.target.value)}
                        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="available">Set Available</option>
                        <option value="on_trip">On Trip</option>
                        <option value="offline">Set Offline</option>
                        <option value="busy">Set Busy</option>
                      </select>
                      <button
                        onClick={() => handleEdit(driver)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver._id)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <Footer />
      </AdminLayout>
    </>
  );
}
