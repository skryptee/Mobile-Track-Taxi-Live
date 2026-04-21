'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminLayout } from '@/components/AdminLayout';
import { 
  Edit2, Trash2, Plus, Search, MessageCircle, CheckCircle, PlayCircle, 
  Clock, UserPlus, X, Send, Ban, Star, MapPin, CreditCard, 
  AlertTriangle, RefreshCw, Navigation, Phone
} from 'lucide-react';
import useSWR from 'swr';
import {
  generateBookingCreatedMessage,
  generateBookingConfirmedMessage,
  generateDriverAssignedMessage,
  generateDriverArrivedMessage,
  generateTripStartedMessage,
  generateTripCompletedMessage,
  generateBookingCancelledMessage,
  generatePaymentReminderMessage,
  generateRatingRequestMessage,
  generateAdminNewBookingAlert,
  generateDriverNewTripMessage,
  openWhatsApp,
  calculateFare,
} from '@/lib/whatsapp';

interface Booking {
  _id: string;
  bookingId: string;
  customerId: { _id: string; name: string; phone: string };
  driverId?: { 
    _id: string; 
    name: string; 
    phone: string; 
    vehicleNumber: string; 
    vehicleType: string;
    vehicleModel?: string;
    rating?: number;
  };
  pickupLocation: string;
  dropoffLocation: string;
  bookingType: string;
  vehicleType: string;
  acType: string;
  estimatedFare: number;
  finalFare?: number;
  estimatedDistance?: number;
  actualDistance?: number;
  baseFare?: number;
  distanceCharge?: number;
  status: string;
  pickupTime: string;
  whatsappPhone?: string;
  // Cancellation
  cancellationReason?: string;
  cancelledBy?: string;
  cancellationPenalty?: number;
  // Rating
  rating?: number;
  feedback?: string;
  // Payment
  paymentStatus?: string;
  paymentMethod?: string;
  // OTP
  pickupOtp?: string;
  otpVerified?: boolean;
  createdAt?: string;
}

interface Driver {
  _id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleModel?: string;
  status: string;
  rating?: number;
}

interface FareConfig {
  _id: string;
  name: string;
  vehicleType: string;
  acType: string;
  baseRate: number;
  perKmRate: number;
  minimumFare: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Calculate cancellation penalty (5 minutes rule)
const calculateCancellationPenalty = (booking: Booking): number => {
  if (!booking.createdAt) return 0;
  const createdAt = new Date(booking.createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  // No penalty if cancelled within 5 minutes
  if (diffMinutes <= 5) return 0;
  // 10% penalty if driver was assigned
  if (booking.driverId) return Math.round(booking.estimatedFare * 0.1);
  return 0;
};

export default function BookingsPage() {
  const { data: bookings = [], isLoading, mutate } = useSWR<Booking[]>('/api/bookings', fetcher);
  const { data: drivers = [] } = useSWR<Driver[]>('/api/drivers', fetcher);
  const { data: customers = [] } = useSWR('/api/customers', fetcher);
  const { data: fareConfigs = [] } = useSWR<FareConfig[]>('/api/fare-config', fetcher);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  
  // Debug: log when showForm changes
  useEffect(() => {
    console.log('[v0] showForm state changed to:', showForm);
  }, [showForm]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actualKms, setActualKms] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    pickupLocation: '',
    dropoffLocation: '',
    bookingType: 'local',
    vehicleType: 'sedan',
    acType: 'ac',
    estimatedDistance: '',
    estimatedFare: '',
    driverId: '',
    pickupTime: '',
    paymentMethod: 'cash',
    isRecurring: false,
    recurringPattern: '',
  });

  // Load admin phone from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('adminNotificationPhone');
    if (savedPhone) setAdminPhone(savedPhone);
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.bookingId?.includes(searchTerm) ||
      booking.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get applicable fare config
  const getApplicableFareConfig = (vehicleType: string, acType: string): FareConfig | undefined => {
    return fareConfigs.find(
      (config) =>
        (config.vehicleType === vehicleType || config.vehicleType === 'all') &&
        (config.acType === acType || config.acType === 'both')
    );
  };

  // Calculate estimated fare based on distance
  const calculateEstimatedFare = (distance: number, vehicleType: string, acType: string): number => {
    const fareConfig = getApplicableFareConfig(vehicleType, acType);
    if (fareConfig && distance > 0) {
      const { totalFare } = calculateFare(distance, fareConfig);
      return totalFare;
    }
    return 0;
  };

  // Auto-calculate fare when distance changes
  const handleDistanceChange = (distance: string) => {
    setFormData((prev) => {
      const newDistance = parseFloat(distance) || 0;
      const estimatedFare = calculateEstimatedFare(newDistance, prev.vehicleType, prev.acType);
      return {
        ...prev,
        estimatedDistance: distance,
        estimatedFare: estimatedFare > 0 ? estimatedFare.toString() : prev.estimatedFare,
      };
    });
  };

  // Recalculate when vehicle type or AC type changes
  const handleVehicleChange = (field: 'vehicleType' | 'acType', value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      const distance = parseFloat(prev.estimatedDistance) || 0;
      if (distance > 0) {
        const estimatedFare = calculateEstimatedFare(
          distance,
          field === 'vehicleType' ? value : prev.vehicleType,
          field === 'acType' ? value : prev.acType
        );
        newData.estimatedFare = estimatedFare > 0 ? estimatedFare.toString() : prev.estimatedFare;
      }
      return newData;
    });
  };

 const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  console.log("🔥 SUBMIT TRIGGERED");

  if (isSubmitting) return;

  setError('');
  setIsSubmitting(true);

  try {
    // ✅ VALIDATION
    if (!formData.customerId) throw new Error('Select customer');
    if (!formData.pickupLocation.trim()) throw new Error('Enter pickup location');
    if (!formData.dropoffLocation.trim()) throw new Error('Enter drop location');

    if (!formData.estimatedFare || parseFloat(formData.estimatedFare) <= 0) {
      throw new Error('Fare must be greater than 0');
    }

    const customer = customers.find((c: any) => c._id === formData.customerId);

    if (!customer) throw new Error('Customer not found');

    const payload = {
      ...formData,
      customerId: formData.customerId,
      driverId: formData.driverId || null,
      estimatedFare: parseFloat(formData.estimatedFare),
      estimatedDistance: parseFloat(formData.estimatedDistance) || 0,
      pickupTime: formData.pickupTime
        ? new Date(formData.pickupTime).toISOString()
        : new Date().toISOString(),
      whatsappPhone: customer.phone,
      paymentStatus: 'pending',
    };

    console.log("🚀 PAYLOAD:", payload);

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("📡 RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.error || 'Booking failed');
    }

    // ✅ SUCCESS
    resetForm();
    mutate();

  } catch (err: any) {
    console.error("❌ ERROR:", err);
    setError(err.message || 'Something went wrong');
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setFormData({
      customerId: '',
      pickupLocation: '',
      dropoffLocation: '',
      bookingType: 'local',
      vehicleType: 'sedan',
      acType: 'ac',
      estimatedDistance: '',
      estimatedFare: '',
      driverId: '',
      pickupTime: '',
      paymentMethod: 'cash',
      isRecurring: false,
      recurringPattern: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  // WhatsApp message generators for each status
  const sendBookingConfirmedWhatsApp = (booking: Booking) => {
    if (!booking.customerId?.phone) return;
    const message = generateBookingConfirmedMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.estimatedFare,
        distance: booking.estimatedDistance,
        pickupTime: booking.pickupTime,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendDriverAssignedWhatsApp = (booking: Booking, notifyDriver = true) => {
    if (!booking.customerId?.phone || !booking.driverId) return;
    
    const bookingInfo = {
      bookingId: booking.bookingId,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      vehicleType: booking.vehicleType,
      acType: booking.acType,
      fare: booking.estimatedFare,
      distance: booking.estimatedDistance,
      pickupTime: booking.pickupTime,
    };
    
    const driverInfo = {
      name: booking.driverId.name,
      phone: booking.driverId.phone,
      vehicleNumber: booking.driverId.vehicleNumber,
      vehicleType: booking.driverId.vehicleType,
      vehicleModel: booking.driverId.vehicleModel,
      rating: booking.driverId.rating,
    };
    
    // Send to customer
    const customerMessage = generateDriverAssignedMessage(
      bookingInfo,
      { name: booking.customerId.name, phone: booking.customerId.phone },
      driverInfo
    );
    openWhatsApp(booking.customerId.phone, customerMessage);

    // Send to driver
    if (notifyDriver) {
      setTimeout(() => {
        const driverMessage = generateDriverNewTripMessage(
          bookingInfo,
          { name: booking.customerId.name, phone: booking.customerId.phone },
          driverInfo
        );
        openWhatsApp(booking.driverId!.phone, driverMessage);
      }, 1000);
    }
  };

  const sendDriverArrivedWhatsApp = (booking: Booking, otp: string) => {
    if (!booking.customerId?.phone || !booking.driverId) return;
    const message = generateDriverArrivedMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.estimatedFare,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      {
        name: booking.driverId.name,
        phone: booking.driverId.phone,
        vehicleNumber: booking.driverId.vehicleNumber,
        vehicleType: booking.driverId.vehicleType,
      },
      otp
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendTripStartedWhatsApp = (booking: Booking) => {
    if (!booking.customerId?.phone || !booking.driverId) return;
    const message = generateTripStartedMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.estimatedFare,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      {
        name: booking.driverId.name,
        phone: booking.driverId.phone,
        vehicleNumber: booking.driverId.vehicleNumber,
        vehicleType: booking.driverId.vehicleType,
      }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendTripCompletedWhatsApp = (booking: Booking, totalKms: number, fareBreakdown: { baseFare: number; perKmCharge: number; totalFare: number }) => {
    if (!booking.customerId?.phone || !booking.driverId) return;
    const message = generateTripCompletedMessage(
      {
        bookingId: booking.bookingId,
        totalKms,
        baseFare: fareBreakdown.baseFare,
        perKmCharge: fareBreakdown.perKmCharge,
        totalFare: fareBreakdown.totalFare,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      {
        name: booking.driverId.name,
        phone: booking.driverId.phone,
        vehicleNumber: booking.driverId.vehicleNumber,
        vehicleType: booking.driverId.vehicleType,
      }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendCancellationWhatsApp = (booking: Booking, reason: string, penalty: number) => {
    if (!booking.customerId?.phone) return;
    const message = generateBookingCancelledMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.estimatedFare,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      {
        bookingId: booking.bookingId,
        reason,
        cancelledBy: 'admin',
        penalty: penalty > 0 ? penalty : undefined,
      }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendPaymentReminderWhatsApp = (booking: Booking) => {
    if (!booking.customerId?.phone) return;
    const message = generatePaymentReminderMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.finalFare || booking.estimatedFare,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      booking.finalFare || booking.estimatedFare,
      booking.paymentMethod
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const sendRatingRequestWhatsApp = (booking: Booking) => {
    if (!booking.customerId?.phone || !booking.driverId) return;
    const message = generateRatingRequestMessage(
      {
        bookingId: booking.bookingId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        vehicleType: booking.vehicleType,
        acType: booking.acType,
        fare: booking.finalFare || booking.estimatedFare,
      },
      { name: booking.customerId.name, phone: booking.customerId.phone },
      {
        name: booking.driverId.name,
        phone: booking.driverId.phone,
        vehicleNumber: booking.driverId.vehicleNumber,
        vehicleType: booking.driverId.vehicleType,
      }
    );
    openWhatsApp(booking.customerId.phone, message);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
        if (response.ok) {
          mutate();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

const handleStatusChange = async (
  id: string,
  newStatus: string,
  booking: Booking,
  additionalData?: any
) => {
  try {
    console.log("🔥 STATUS CHANGE:", newStatus);

    const updateData: any = { status: newStatus, ...additionalData };

    if (newStatus === "ongoing") {
      updateData.tripStartTime = new Date().toISOString();
    }

    if (newStatus === "driver_arrived") {
      const otp = generateOTP();
      updateData.pickupOtp = otp;
      updateData.driverArrivedAt = new Date().toISOString();
    }

    const response = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    console.log("📡 STATUS RESPONSE:", data);

    // ❗ THIS WAS MISSING
    if (!response.ok) {
      throw new Error(data.error || "Status update failed");
    }

    await mutate();

    // ✅ WhatsApp triggers
    if (newStatus === "confirmed") {
      sendBookingConfirmedWhatsApp(booking);
    } else if (newStatus === "driver_arrived") {
      sendDriverArrivedWhatsApp(booking, updateData.pickupOtp);
    } else if (newStatus === "ongoing") {
      sendTripStartedWhatsApp(booking);
    }

    return data;

  } catch (error: any) {
    console.error("❌ STATUS ERROR:", error);
    setError(error.message || "Status update failed");
  }
};

const openCompleteModal = (booking: Booking) => {
  console.log("OPEN COMPLETE MODAL:", booking);

  setSelectedBooking(booking);

  setActualKms(
    booking.actualDistance?.toString() ||
    booking.estimatedDistance?.toString() ||
    "1"
  );

  setShowCompleteModal(true);
};

const handleCompleteTrip = async () => {
  console.log("🔥 COMPLETE TRIP CLICKED");

  if (!selectedBooking) return;

const kms = Math.max(1, parseFloat(actualKms || "0"));
  if (kms <= 0) {
    setError("Enter valid distance");
    return;
  }

  try {
    const fareConfig = getApplicableFareConfig(
      selectedBooking.vehicleType,
      selectedBooking.acType
    );

    const fareBreakdown = fareConfig
      ? calculateFare(kms, fareConfig)
      : {
          baseFare: 0,
          perKmCharge: 0,
          totalFare: selectedBooking.estimatedFare,
        };

    const payload = {
      status: "completed",
      actualDistance: kms,
      finalFare: fareBreakdown.totalFare,
      baseFare: fareBreakdown.baseFare,
      distanceCharge: fareBreakdown.perKmCharge,
      completionTime: new Date().toISOString(),
    };

    console.log("🚀 COMPLETE PAYLOAD:", payload);

    const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("📡 COMPLETE RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to complete trip");
    }

    // ✅ IMPORTANT
    await mutate(); // force refresh

    // ✅ WhatsApp
    sendTripCompletedWhatsApp(selectedBooking, kms, fareBreakdown);

    // ✅ Reset UI
    setShowCompleteModal(false);
    setSelectedBooking(null);
    setActualKms("");

  } catch (err: any) {
    console.error("❌ COMPLETE ERROR:", err);
    setError(err.message || "Completion failed");
  }
};

  const openAssignModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedDriverId(booking.driverId?._id || '');
    setShowAssignModal(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedBooking || !selectedDriverId) return;

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId: selectedDriverId,
          status: 'driver_assigned',
          driverAssignedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        // Send driver assigned WhatsApp to both customer and driver
        sendDriverAssignedWhatsApp(updatedBooking, true);
        setShowAssignModal(false);
        setSelectedBooking(null);
        setSelectedDriverId('');
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancellationReason) return;

    const penalty = calculateCancellationPenalty(selectedBooking);

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason,
          cancelledBy: 'admin',
          cancelledAt: new Date().toISOString(),
          cancellationPenalty: penalty,
        }),
      });

      if (response.ok) {
        sendCancellationWhatsApp(selectedBooking, cancellationReason, penalty);
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancellationReason('');
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openRatingModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRatingValue(booking.rating || 5);
    setFeedbackText(booking.feedback || '');
    setShowRatingModal(true);
  };

  const handleSaveRating = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingValue,
          feedback: feedbackText,
          ratedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setShowRatingModal(false);
        setSelectedBooking(null);
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const confirmBooking = async (booking: Booking) => {
    await handleStatusChange(booking._id, 'confirmed', booking);
  };

  const markDriverArrived = async (booking: Booking) => {
    await handleStatusChange(booking._id, 'driver_arrived', booking);
  };

  const startTrip = async (booking: Booking) => {
    await handleStatusChange(booking._id, 'ongoing', booking);
  };

  const markPaymentComplete = async (booking: Booking) => {
    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'completed' }),
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Get current fare calculation preview
  const getFarePreview = () => {
    const distance = parseFloat(actualKms) || 0;
    if (!selectedBooking || distance <= 0) return null;
    
    const fareConfig = getApplicableFareConfig(selectedBooking.vehicleType, selectedBooking.acType);
    if (!fareConfig) return null;
    
    return calculateFare(distance, fareConfig);
  };

  const farePreview = getFarePreview();

  // Available drivers only
  const availableDrivers = drivers.filter((d) => d.status === 'available' || d.status === 'offline');

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      confirmed: 'bg-cyan-500/10 text-cyan-600',
      driver_assigned: 'bg-indigo-500/10 text-indigo-600',
      driver_arrived: 'bg-purple-500/10 text-purple-600',
      ongoing: 'bg-blue-500/10 text-blue-600',
      completed: 'bg-green-500/10 text-green-600',
      cancelled: 'bg-red-500/10 text-red-600',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-600';
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    driver_assigned: 'Driver Assigned',
    driver_arrived: 'Driver Arrived',
    ongoing: 'Trip Started',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <>
      <AdminSidebar />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
              <p className="text-muted-foreground mt-1">Manage taxi bookings with WhatsApp notifications</p>
            </div>
            <button
              type="button"
              onClick={() => {
  setShowForm(true);
  setEditingId(null);
  setError('');
  setFormData({
    customerId: '',
    pickupLocation: '',
    dropoffLocation: '',
    bookingType: 'local',
    vehicleType: 'sedan',
    acType: 'ac',
    estimatedDistance: '',
    estimatedFare: '',
    driverId: '',
    pickupTime: '',
    paymentMethod: 'cash',
    isRecurring: false,
    recurringPattern: '',
  });
}}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
              New Booking
            </button>
          </div>

          {showForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Create Booking</h2>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="ml-auto">
                    <X size={16} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer: any) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>

                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Assign Driver (optional)</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.vehicleNumber}) - {driver.status}
                    </option>
                  ))}
                </select>

                <input
                  type="datetime-local"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  placeholder="Pickup Location"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <input
                  type="text"
                  placeholder="Dropoff Location"
                  value={formData.dropoffLocation}
                  onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                  required
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <select
                  value={formData.bookingType}
                  onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="local">Local</option>
                  <option value="package">Package</option>
                  <option value="outstation">Outstation</option>
                </select>

                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleVehicleChange('vehicleType', e.target.value)}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="mini">Mini</option>
                  <option value="auto">Auto</option>
                </select>

                <select
                  value={formData.acType}
                  onChange={(e) => handleVehicleChange('acType', e.target.value)}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ac">AC</option>
                  <option value="non_ac">Non-AC</option>
                </select>

                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="wallet">Wallet</option>
                </select>

                <input
                  type="number"
                  placeholder="Estimated Distance (KM)"
                  value={formData.estimatedDistance}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="relative">
                  <input
                    type="number"
                    placeholder="Estimated Fare (Rs.)"
                    value={formData.estimatedFare}
                    onChange={(e) => setFormData({ ...formData, estimatedFare: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {formData.estimatedDistance && formData.estimatedFare && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Auto
                    </span>
                  )}
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <button
  type="button"
  onClick={(e) => handleSubmit(e as any)}
  disabled={isSubmitting}
  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? (
    <>
      <RefreshCw size={18} className="animate-spin" />
      Creating...
    </>
  ) : (
    <>
      <Send size={18} />
      Create & Send WhatsApp
    </>
  )}
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
                placeholder="Search by booking ID, customer, or location..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="driver_arrived">Driver Arrived</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No bookings found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Booking ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Driver</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Fare</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-foreground">{booking.bookingId}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(booking.pickupTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-foreground">{booking.customerId?.name}</div>
                          <a 
                            href={`tel:${booking.customerId?.phone}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone size={10} />
                            {booking.customerId?.phone}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          {booking.driverId ? (
                            <div>
                              <div className="text-foreground flex items-center gap-1">
                                {booking.driverId.name}
                                {booking.driverId.rating && (
                                  <span className="text-xs text-yellow-600 flex items-center">
                                    <Star size={10} className="fill-yellow-500" />
                                    {booking.driverId.rating}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{booking.driverId.vehicleNumber}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(booking)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <UserPlus size={14} />
                              Assign Driver
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-foreground flex items-center gap-1">
                            <MapPin size={10} className="text-green-600" />
                            {booking.pickupLocation}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Navigation size={10} className="text-red-600" />
                            {booking.dropoffLocation}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-foreground font-medium">
                            Rs.{booking.finalFare || booking.estimatedFare}
                          </div>
                          {booking.actualDistance && (
                            <div className="text-xs text-muted-foreground">{booking.actualDistance} KM</div>
                          )}
                          {booking.rating && (
                            <div className="text-xs text-yellow-600 flex items-center gap-1">
                              <Star size={10} className="fill-yellow-500" />
                              {booking.rating}/5
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                            {statusLabels[booking.status] || booking.status}
                          </span>
                          {booking.pickupOtp && booking.status === 'driver_arrived' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              OTP: <span className="font-mono font-bold">{booking.pickupOtp}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            booking.paymentStatus === 'completed' 
                              ? 'bg-green-500/10 text-green-600' 
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {booking.paymentStatus || 'pending'}
                          </span>
                          {booking.paymentMethod && (
                            <div className="text-xs text-muted-foreground capitalize">{booking.paymentMethod}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {/* Status progression buttons */}
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => confirmBooking(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-cyan-500/10"
                                title="Confirm Booking"
                              >
                                <CheckCircle size={16} className="text-cyan-600" />
                              </button>
                            )}
                            
                            {booking.status === 'confirmed' && !booking.driverId && (
                              <button
                                onClick={() => openAssignModal(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-indigo-500/10"
                                title="Assign Driver"
                              >
                                <UserPlus size={16} className="text-indigo-600" />
                              </button>
                            )}
                            
                            {booking.status === 'driver_assigned' && (
                              <button
                                onClick={() => markDriverArrived(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-purple-500/10"
                                title="Mark Driver Arrived"
                              >
                                <MapPin size={16} className="text-purple-600" />
                              </button>
                            )}
                            
                            {booking.status === 'driver_arrived' && (
                              <button
                                onClick={() => startTrip(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-blue-500/10"
                                title="Start Trip"
                              >
                                <PlayCircle size={16} className="text-blue-600" />
                              </button>
                            )}
                            
                            {['ongoing', 'driver_arrived'].includes(booking.status) && (
                              <button
                                onClick={() => openCompleteModal(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-green-500/10"
                                title="Complete Trip"
                              >
                                <CheckCircle size={16} className="text-green-600" />
                              </button>
                            )}

                            {/* Payment and rating for completed trips */}
                            {booking.status === 'completed' && booking.paymentStatus !== 'completed' && (
                              <>
                                <button
                                  onClick={() => markPaymentComplete(booking)}
                                  className="p-1.5 hover:bg-accent rounded transition-colors bg-green-500/10"
                                  title="Mark Payment Complete"
                                >
                                  <CreditCard size={16} className="text-green-600" />
                                </button>
                                <button
                                  onClick={() => sendPaymentReminderWhatsApp(booking)}
                                  className="p-1.5 hover:bg-accent rounded transition-colors bg-yellow-500/10"
                                  title="Send Payment Reminder"
                                >
                                  <AlertTriangle size={16} className="text-yellow-600" />
                                </button>
                              </>
                            )}

                            {booking.status === 'completed' && (
                              <button
                                onClick={() => openRatingModal(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-yellow-500/10"
                                title="View/Add Rating"
                              >
                                <Star size={16} className="text-yellow-600" />
                              </button>
                            )}

                            {/* Cancel button for non-completed bookings */}
                            {!['completed', 'cancelled'].includes(booking.status) && (
                              <button
                                onClick={() => openCancelModal(booking)}
                                className="p-1.5 hover:bg-accent rounded transition-colors bg-red-500/10"
                                title="Cancel Booking"
                              >
                                <Ban size={16} className="text-red-600" />
                              </button>
                            )}

                            {/* WhatsApp button */}
                            <button
                              onClick={() => {
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
                              }}
                              className="p-1.5 hover:bg-accent rounded transition-colors"
                              title="Send WhatsApp"
                            >
                              <MessageCircle size={16} className="text-green-600" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDelete(booking._id)}
                              className="p-1.5 hover:bg-accent rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-destructive" />
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

          {/* WhatsApp Info */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <MessageCircle size={18} />
              WhatsApp Notifications
            </h3>
            <p className="text-sm text-green-600">
              WhatsApp messages are sent automatically at each status change: Booking Created, Confirmed, Driver Assigned, Driver Arrived (with OTP), Trip Started, and Trip Completed with fare breakdown and rating request.
            </p>
          </div>
        </div>

        {/* Complete Trip Modal */}
        {showCompleteModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Complete Trip</h3>
                <button onClick={() => setShowCompleteModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-foreground">{selectedBooking.bookingId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="text-foreground">{selectedBooking.pickupLocation} to {selectedBooking.dropoffLocation}</p>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Actual Distance (KM)</label>
                  <input
                    type="number"
                    value={actualKms}
                    onChange={(e) => setActualKms(e.target.value)}
                    placeholder="Enter actual KMs"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {farePreview && (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-foreground">Fare Breakdown</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span className="text-foreground">Rs.{farePreview.baseFare}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Distance ({actualKms} km)</span>
                      <span className="text-foreground">Rs.{farePreview.perKmCharge}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-semibold">
                      <span className="text-foreground">Total Fare</span>
                      <span className="text-primary">Rs.{farePreview.totalFare}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCompleteTrip}
                    disabled={false}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Complete & Send WhatsApp
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Driver Modal */}
        {showAssignModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Assign Driver</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-foreground">{selectedBooking.bookingId}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-foreground">{selectedBooking.customerId?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Required</p>
                  <p className="text-foreground">{selectedBooking.vehicleType.toUpperCase()} ({selectedBooking.acType.toUpperCase()})</p>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Select Driver</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a driver</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.vehicleNumber} ({driver.vehicleType}) - {driver.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-600">
                  Both customer and driver will receive WhatsApp notifications with trip details.
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAssignDriver}
                    disabled={!selectedDriverId}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <UserPlus size={18} />
                    Assign & Notify
                  </button>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Booking Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Cancel Booking</h3>
                <button onClick={() => setShowCancelModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-foreground">{selectedBooking.bookingId}</p>
                </div>

                {calculateCancellationPenalty(selectedBooking) > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-600 font-medium">
                      Cancellation Penalty: Rs.{calculateCancellationPenalty(selectedBooking)}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Penalty applies as booking was created more than 5 minutes ago with driver assigned.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Cancellation Reason</label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select reason</option>
                    <option value="Customer requested cancellation">Customer requested cancellation</option>
                    <option value="Driver not available">Driver not available</option>
                    <option value="Vehicle breakdown">Vehicle breakdown</option>
                    <option value="Customer unreachable">Customer unreachable</option>
                    <option value="Duplicate booking">Duplicate booking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {cancellationReason === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter reason"
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelBooking}
                    disabled={!cancellationReason}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Ban size={18} />
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Trip Rating</h3>
                <button onClick={() => setShowRatingModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-foreground">{selectedBooking.bookingId}</p>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingValue(star)}
                        className="p-1"
                      >
                        <Star 
                          size={32} 
                          className={star <= ratingValue ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Feedback (Optional)</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Customer feedback..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveRating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Star size={18} />
                    Save Rating
                  </button>
                  <button
                    onClick={() => sendRatingRequestWhatsApp(selectedBooking)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Request rating via WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
