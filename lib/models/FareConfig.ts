import mongoose, { Document, Schema } from 'mongoose';

export interface IFareConfig extends Document {
  name: string;
  description?: string;
  vehicleType: 'sedan' | 'suv' | 'mini' | 'all';
  acType: 'ac' | 'non_ac' | 'both';
  baseRate: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  waitingChargePerMin?: number;
  peakHourMultiplier?: number;
  nightChargeMultiplier?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FareConfigSchema = new Schema<IFareConfig>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'mini', 'all'],
      required: true,
    },
    acType: {
      type: String,
      enum: ['ac', 'non_ac', 'both'],
      required: true,
    },
    baseRate: {
      type: Number,
      required: true,
    },
    perKmRate: {
      type: Number,
      required: true,
    },
    perMinuteRate: {
      type: Number,
      required: true,
    },
    minimumFare: {
      type: Number,
      required: true,
    },
    waitingChargePerMin: Number,
    peakHourMultiplier: {
      type: Number,
      default: 1,
    },
    nightChargeMultiplier: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const FareConfig = mongoose.models?.FareConfig || mongoose.model<IFareConfig>('FareConfig', FareConfigSchema);
