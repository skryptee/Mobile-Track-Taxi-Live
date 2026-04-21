'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { Edit2, Trash2, Plus } from 'lucide-react';
import useSWR from 'swr';

interface FareConfig {
  _id: string;
  name: string;
  vehicleType: string;
  acType: string;
  baseRate: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FareConfigPage() {
  const { data: configs = [], isLoading } = useSWR<FareConfig[]>('/api/fare-config', fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vehicleType: 'sedan',
    acType: 'ac',
    baseRate: '',
    perKmRate: '',
    perMinuteRate: '',
    minimumFare: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/fare-config/${editingId}` : '/api/fare-config';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          baseRate: parseFloat(formData.baseRate),
          perKmRate: parseFloat(formData.perKmRate),
          perMinuteRate: parseFloat(formData.perMinuteRate),
          minimumFare: parseFloat(formData.minimumFare),
        }),
      });

      if (response.ok) {
        setFormData({
          name: '',
          vehicleType: 'sedan',
          acType: 'ac',
          baseRate: '',
          perKmRate: '',
          perMinuteRate: '',
          minimumFare: '',
        });
        setShowForm(false);
        setEditingId(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this fare config?')) {
      try {
        const response = await fetch(`/api/fare-config/${id}`, { method: 'DELETE' });
        if (response.ok) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (config: FareConfig) => {
    setFormData({
      name: config.name,
      vehicleType: config.vehicleType,
      acType: config.acType,
      baseRate: config.baseRate.toString(),
      perKmRate: config.perKmRate.toString(),
      perMinuteRate: config.perMinuteRate.toString(),
      minimumFare: config.minimumFare.toString(),
    });
    setEditingId(config._id);
    setShowForm(true);
  };

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fare Configuration</h1>
              <p className="text-muted-foreground mt-1">Manage taxi fare rates</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({
                  name: '',
                  vehicleType: 'sedan',
                  acType: 'ac',
                  baseRate: '',
                  perKmRate: '',
                  perMinuteRate: '',
                  minimumFare: '',
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
              Add Fare Config
            </button>
          </div>

          {showForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingId ? 'Edit Fare Configuration' : 'Add New Fare Configuration'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Config Name (e.g., Delhi Rates)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
                  <option value="all">All Vehicles</option>
                </select>

                <select
                  value={formData.acType}
                  onChange={(e) => setFormData({ ...formData, acType: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ac">AC</option>
                  <option value="non_ac">Non-AC</option>
                  <option value="both">Both</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Base Rate (₹)"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Per KM Rate (₹)"
                  value={formData.perKmRate}
                  onChange={(e) => setFormData({ ...formData, perKmRate: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Per Minute Rate (₹)"
                  value={formData.perMinuteRate}
                  onChange={(e) => setFormData({ ...formData, perMinuteRate: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Minimum Fare (₹)"
                  value={formData.minimumFare}
                  onChange={(e) => setFormData({ ...formData, minimumFare: e.target.value })}
                  required
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

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : configs.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No fare configs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Vehicle</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">AC Type</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Base Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Per KM</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Per Min</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Min Fare</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr key={config._id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4 text-foreground">{config.name}</td>
                        <td className="py-3 px-4 text-foreground capitalize">{config.vehicleType}</td>
                        <td className="py-3 px-4 text-foreground capitalize">{config.acType}</td>
                        <td className="py-3 px-4 text-foreground">₹{config.baseRate}</td>
                        <td className="py-3 px-4 text-foreground">₹{config.perKmRate}</td>
                        <td className="py-3 px-4 text-foreground">₹{config.perMinuteRate}</td>
                        <td className="py-3 px-4 text-foreground">₹{config.minimumFare}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(config)}
                              className="p-1 hover:bg-accent rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(config._id)}
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

          {/* Pricing Info Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">From Your Tariff Sheet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Sedan (Local - Non AC)</p>
                <p className="text-muted-foreground">Base: ₹200 for 3km, Per KM: ₹25, Waiting: ₹4/min</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Sedan (Local - AC)</p>
                <p className="text-muted-foreground">Base: ₹200 for 3km, Per KM: ₹25, Waiting: ₹4/min</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">SUV/MUV (Local - Non AC)</p>
                <p className="text-muted-foreground">Base: ₹300 for 3km, Per KM: ₹30, Waiting: ₹6/min</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">SUV/MUV (Local - AC)</p>
                <p className="text-muted-foreground">Base: ₹300 for 3km, Per KM: ₹30, Waiting: ₹6/min</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
