import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  customerId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  bookingType: 'local' | 'package' | 'outstation';
  estimatedDistance?: number;
  actualDistance?: number;
  duration?: number;
  vehicleType: 'sedan' | 'suv' | 'mini' | 'auto' | 'other';
  acType: 'ac' | 'non_ac';
  estimatedFare: number;
  finalFare?: number;
  baseFare?: number;
  distanceCharge?: number;
  status: 'pending' | 'confirmed' | 'driver_assigned' | 'driver_arrived' | 'ongoing' | 'completed' | 'cancelled';
  pickupTime: Date;
  tripStartTime?: Date;
  tripEndTime?:Date;
  completionTime?: Date;
  notes?: string;
  
  // Cancellation details
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'driver' | 'admin';
  cancelledAt?: Date;
  cancellationPenalty?: number;
  
  // Rating & Feedback
  rating?: number;
  feedback?: string;
  ratedAt?: Date;
  driverRating?: number; // Rating given by driver to customer
  
  // Payment details
  paymentStatus: 'pending' | 'partial' | 'completed' | 'refunded';
  paymentMethod?: 'cash' | 'upi' | 'card' | 'wallet';
  paymentId?: string;
  
  // Recurring booking
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  parentBookingId?: string; // For recurring bookings
  
  // Driver status updates
  driverAssignedAt?: Date;
  driverArrivedAt?: Date;
  
  // OTP for pickup verification
  pickupOtp?: string;
  otpVerified?: boolean;
  
  whatsappPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
      trim: true,
    },
    pickupLatitude: Number,
    pickupLongitude: Number,
    dropoffLatitude: Number,
    dropoffLongitude: Number,
    bookingType: {
      type: String,
      enum: ['local', 'package', 'outstation'],
      required: true,
    },
    estimatedDistance: Number,
    actualDistance: Number,
    duration: Number,
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'mini', 'auto', 'other'],
      required: true,
    },
    acType: {
      type: String,
      enum: ['ac', 'non_ac'],
      required: true,
    },
    estimatedFare: {
      type: Number,
      required: true,
    },
    finalFare: Number,
    baseFare: Number,
    distanceCharge: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'driver_assigned', 'driver_arrived', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },
    pickupTime: {
      type: Date,
      required: true,
    },
    tripStartTime: Date,
    completionTime: Date,
    notes: String,
    tripEndTime: { type: Date },
    // Cancellation
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ['customer', 'driver', 'admin'],
    },
    cancelledAt: Date,
    cancellationPenalty: {
      type: Number,
      default: 0,
    },
    
    // Rating
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    ratedAt: Date,
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    
    // Payment
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'wallet'],
    },
    paymentId: String,
    
    // Recurring
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    parentBookingId: String,
    
    // Driver updates
    driverAssignedAt: Date,
    driverArrivedAt: Date,
    
    // OTP
    pickupOtp: String,
    otpVerified: {
      type: Boolean,
      default: false,
    },
    
    whatsappPhone: String,
  },
  { timestamps: true }
);

export const Booking = mongoose.models?.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
