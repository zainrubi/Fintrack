import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';
import type { SavingsCategory } from './savings-goal';

export interface ISavingsRecord extends Document {
  userId: string;
  goalId?: string | null;
  amount: Types.Decimal128;
  currency: string;
  category: SavingsCategory;
  date: Date;
  periodYear: number;
  periodMonth: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const SavingsRecordSchema = new Schema<ISavingsRecord>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    goalId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Savings amount is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    currency: {
      type: String,
      required: true,
      default: 'PKR',
      maxlength: 3,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'EMERGENCY_FUND',
        'RETIREMENT',
        'HOUSE_DOWNPAYMENT',
        'EDUCATION',
        'WEDDING',
        'TRAVEL_VACATION',
        'HAJJ_UMRAH',
        'GENERAL_SAVINGS',
        'OTHER',
      ],
      default: 'GENERAL_SAVINGS',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'date is required.'],
    },
    periodYear: {
      type: Number,
      required: [true, 'periodYear is required.'],
      min: 1900,
      max: 2100,
    },
    periodMonth: {
      type: Number,
      required: [true, 'periodMonth is required.'],
      min: 1,
      max: 12,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'savings_records',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

SavingsRecordSchema.index({ userId: 1, periodYear: 1, periodMonth: 1 });
SavingsRecordSchema.index({ userId: 1, date: -1 });
SavingsRecordSchema.index({ userId: 1, goalId: 1 });

export const SavingsRecordModel: Model<ISavingsRecord> =
  mongoose.models.SavingsRecord ||
  mongoose.model<ISavingsRecord>('SavingsRecord', SavingsRecordSchema);

export default SavingsRecordModel;
