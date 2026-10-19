import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';

export type InsuranceCategory =
  | 'HEALTH'
  | 'LIFE'
  | 'VEHICLE'
  | 'HOME'
  | 'DISABILITY'
  | 'OTHER';

export type InsuranceFrequency =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'ANNUALLY';

export interface IInsurancePolicy extends Document {
  userId: string;
  policyName: string;
  policyNumber?: string | null;
  provider?: string | null;
  category: InsuranceCategory;
  premiumAmount: Types.Decimal128;
  currency: string;
  frequency: InsuranceFrequency;
  startDate: Date;
  renewalDate?: Date | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const InsurancePolicySchema = new Schema<IInsurancePolicy>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    policyName: {
      type: String,
      required: [true, 'Policy name is required.'],
      maxlength: 150,
      trim: true,
    },
    policyNumber: {
      type: String,
      maxlength: 100,
      trim: true,
      default: null,
    },
    provider: {
      type: String,
      maxlength: 150,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      enum: ['HEALTH', 'LIFE', 'VEHICLE', 'HOME', 'DISABILITY', 'OTHER'],
      required: [true, 'category is required.'],
    },
    premiumAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'premiumAmount is required.'],
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
    frequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'],
      default: 'ANNUALLY',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'startDate is required.'],
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'insurance_policies',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

InsurancePolicySchema.index({ userId: 1 });

export const InsurancePolicyModel: Model<IInsurancePolicy> =
  mongoose.models.InsurancePolicy ||
  mongoose.model<IInsurancePolicy>('InsurancePolicy', InsurancePolicySchema);

export default InsurancePolicyModel;
