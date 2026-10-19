import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';
import type { InvestmentType } from './investment-asset';

export interface IInvestmentRecord extends Document {
  userId: string;
  assetId?: string | null;
  amount: Types.Decimal128;
  currency: string;
  investmentType: InvestmentType;
  date: Date;
  periodYear: number;
  periodMonth: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const InvestmentRecordSchema = new Schema<IInvestmentRecord>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    assetId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Investment amount is required.'],
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
    investmentType: {
      type: String,
      enum: [
        'MUTUAL_FUND',
        'STOCKS',
        'REAL_ESTATE',
        'GOLD_PRECIOUS_METALS',
        'GOVERNMENT_BONDS',
        'PROVIDENT_FUND',
        'CRYPTO',
        'BUSINESS_VENTURE',
        'OTHER',
      ],
      required: [true, 'investmentType is required.'],
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
    collection: 'investment_records',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

InvestmentRecordSchema.index({ userId: 1, periodYear: 1, periodMonth: 1 });
InvestmentRecordSchema.index({ userId: 1, date: -1 });
InvestmentRecordSchema.index({ userId: 1, assetId: 1 });

export const InvestmentRecordModel: Model<IInvestmentRecord> =
  mongoose.models.InvestmentRecord ||
  mongoose.model<IInvestmentRecord>('InvestmentRecord', InvestmentRecordSchema);

export default InvestmentRecordModel;
