import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleModel?: string;
  vehicleType: 'sedan' | 'suv' | 'mini' | 'auto' | 'other';
  status: 'available' | 'on_trip' | 'offline' | 'busy';
  // Current location for tracking
  currentLocation?: {
    address?: string;
    lat?: number;
    lng?: number;
    updatedAt?: Date;
  };
  // Rating system
  rating: number;
  totalTrips: number;
  totalRatings: number;
  totalEarnings: number;
  // Current booking assigned (if on_trip)
  currentBookingId?: string;
  isActive: boolean;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'mini', 'auto', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'on_trip', 'offline', 'busy'],
      default: 'offline',
    },
    currentLocation: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    currentBookingId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Driver = mongoose.models?.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
