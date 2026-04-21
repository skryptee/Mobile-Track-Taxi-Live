'use client';

import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import useSWR from 'swr';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  rating: number;
  totalBookings: number;
  totalSpent: number;
  isActive: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useSWR<Customer[]>('/api/customers', fetcher);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', phone: '', email: '', address: '' });
        setShowForm(false);
        setEditingId(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        if (response.ok) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setEditingId(customer._id);
    setShowForm(true);
  };

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Customers</h1>
              <p className="text-muted-foreground mt-1">Manage your customers</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({ name: '', phone: '', email: '', address: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
              Add Customer
            </button>
          </div>

          {showForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Address (optional)"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No customers found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Bookings</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Total Spent</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer._id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4 text-foreground">{customer.name}</td>
                        <td className="py-3 px-4 text-foreground">{customer.phone}</td>
                        <td className="py-3 px-4 text-foreground">{customer.email || '-'}</td>
                        <td className="py-3 px-4 text-foreground">{customer.totalBookings}</td>
                        <td className="py-3 px-4 text-foreground">₹{customer.totalSpent.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer._id)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} className="text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
