'use client';

import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { 
  Save, MessageCircle, Bell, Building2, Shield, 
  Phone, Mail, MapPin, Clock, CheckCircle, AlertTriangle,
  Send, TestTube
} from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';

interface NotificationSettings {
  adminPhone: string;
  enableNewBookingAlert: boolean;
  enableDriverStatusNotify: boolean;
  enablePaymentReminder: boolean;
  enableRecurringReminder: boolean;
  enableRatingRequest: boolean;
  cancellationPenaltyMinutes: number;
  cancellationPenaltyPercent: number;
}

interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  supportEmail: string;
}

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Taxi Dispatch',
    email: 'admin@taxidispatch.com',
    phone: '+91-9629425357',
    address: '10/3i, Arunagirinathar Street, Kuttalam-609 801',
    gstNumber: '',
    supportEmail: 'support@taxidispatch.com',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    adminPhone: '',
    enableNewBookingAlert: true,
    enableDriverStatusNotify: true,
    enablePaymentReminder: true,
    enableRecurringReminder: true,
    enableRatingRequest: true,
    cancellationPenaltyMinutes: 5,
    cancellationPenaltyPercent: 10,
  });

  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedCompany = localStorage.getItem('companySettings');
    const savedNotifications = localStorage.getItem('notificationSettings');
    const adminPhone = localStorage.getItem('adminNotificationPhone');
    
    if (savedCompany) {
      setCompanySettings(JSON.parse(savedCompany));
    }
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    } else if (adminPhone) {
      setNotificationSettings(prev => ({ ...prev, adminPhone }));
    }
  }, []);

  const handleSave = async () => {
    localStorage.setItem('companySettings', JSON.stringify(companySettings));
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('adminNotificationPhone', notificationSettings.adminPhone);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sendTestNotification = () => {
    if (!notificationSettings.adminPhone) {
      alert('Please enter admin phone number first');
      return;
    }
    
    const testMessage = `*TEST NOTIFICATION*

This is a test message from ${companySettings.companyName}.

WhatsApp notifications are working correctly!

Current Settings:
- New Booking Alerts: ${notificationSettings.enableNewBookingAlert ? 'Enabled' : 'Disabled'}
- Driver Status Notifications: ${notificationSettings.enableDriverStatusNotify ? 'Enabled' : 'Disabled'}
- Payment Reminders: ${notificationSettings.enablePaymentReminder ? 'Enabled' : 'Disabled'}
- Rating Requests: ${notificationSettings.enableRatingRequest ? 'Enabled' : 'Disabled'}

Time: ${new Date().toLocaleString('en-IN')}`;

    openWhatsApp(notificationSettings.adminPhone, testMessage);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure notifications and company details</p>
          </div>

          {/* WhatsApp Notification Settings */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">WhatsApp Notifications</h2>
                <p className="text-sm text-muted-foreground">Configure admin alerts and customer notifications</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Admin WhatsApp Number
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Receive new booking alerts on this number
                  </p>
                  <input
                    type="tel"
                    placeholder="e.g., 9876543210"
                    value={notificationSettings.adminPhone}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, adminPhone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={sendTestNotification}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <TestTube size={18} />
                  Send Test Notification
                </button>
                {testSent && (
                  <p className="text-sm text-green-600">WhatsApp opened with test message</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Automatic Notifications</h3>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.enableNewBookingAlert}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableNewBookingAlert: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  />
                  <div>
                    <span className="text-sm text-foreground">New Booking Alerts</span>
                    <p className="text-xs text-muted-foreground">Notify admin when new booking is created</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.enableDriverStatusNotify}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableDriverStatusNotify: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  />
                  <div>
                    <span className="text-sm text-foreground">Driver Status Updates</span>
                    <p className="text-xs text-muted-foreground">Notify customer when driver is assigned, arrived, etc.</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.enablePaymentReminder}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enablePaymentReminder: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  />
                  <div>
                    <span className="text-sm text-foreground">Payment Reminders</span>
                    <p className="text-xs text-muted-foreground">Send payment reminder after trip completion</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.enableRatingRequest}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableRatingRequest: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  />
                  <div>
                    <span className="text-sm text-foreground">Rating Requests</span>
                    <p className="text-xs text-muted-foreground">Ask customer for rating after trip completion</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.enableRecurringReminder}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, enableRecurringReminder: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  />
                  <div>
                    <span className="text-sm text-foreground">Recurring Booking Reminders</span>
                    <p className="text-xs text-muted-foreground">Remind customers about recurring bookings</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700">WhatsApp Integration Active</p>
                  <p className="text-xs text-green-600 mt-1">
                    Messages are sent via WhatsApp Web (wa.me links). No API keys required - simply click the buttons to open WhatsApp with pre-filled messages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Cancellation Policy</h2>
                <p className="text-sm text-muted-foreground">Configure cancellation penalty rules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Free Cancellation Window (Minutes)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Customers can cancel without penalty within this time
                </p>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={notificationSettings.cancellationPenaltyMinutes}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, cancellationPenaltyMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cancellation Penalty (%)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Percentage of fare charged as penalty after free window
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={notificationSettings.cancellationPenaltyPercent}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, cancellationPenaltyPercent: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700">
                Current Policy: Free cancellation within {notificationSettings.cancellationPenaltyMinutes} minutes. 
                After that, {notificationSettings.cancellationPenaltyPercent}% of estimated fare is charged as penalty 
                (only if driver was assigned).
              </p>
            </div>
          </div>

          {/* Company Settings */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
                <p className="text-sm text-muted-foreground">Details shown on invoices and notifications</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <input
                  type="text"
                  value={companySettings.companyName}
                  onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">GST Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={companySettings.gstNumber}
                  onChange={(e) => setCompanySettings({ ...companySettings, gstNumber: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                <textarea
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Support Email</label>
                <input
                  type="email"
                  value={companySettings.supportEmail}
                  onChange={(e) => setCompanySettings({ ...companySettings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Shield size={24} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">System Information</h2>
                <p className="text-sm text-muted-foreground">Application details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Version</p>
                <p className="font-mono font-medium text-foreground">2.0.0</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Database</p>
                <p className="font-mono font-medium text-foreground">MongoDB</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">WhatsApp</p>
                <p className="font-mono font-medium text-green-600">Active</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-mono font-medium text-foreground">{new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Save size={18} />
              Save All Settings
            </button>
            {saved && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm">
                <CheckCircle size={16} />
                Settings saved successfully
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
