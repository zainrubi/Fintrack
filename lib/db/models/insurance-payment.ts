import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';

export interface IInsurancePayment extends Document {
  userId: string;
  policyId: string;
  amount: Types.Decimal128;
  currency: string;
  paymentDate: Date;
  periodYear: number;
  periodMonth: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const InsurancePaymentSchema = new Schema<IInsurancePayment>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    policyId: {
      type: String,
      required: [true, 'policyId is required.'],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Insurance payment amount is required.'],
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
    paymentDate: {
      type: Date,
      required: [true, 'paymentDate is required.'],
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
    collection: 'insurance_payments',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

InsurancePaymentSchema.index({ userId: 1, periodYear: 1, periodMonth: 1 });
InsurancePaymentSchema.index({ userId: 1, paymentDate: -1 });
InsurancePaymentSchema.index({ userId: 1, policyId: 1 });

export const InsurancePaymentModel: Model<IInsurancePayment> =
  mongoose.models.InsurancePayment ||
  mongoose.model<IInsurancePayment>('InsurancePayment', InsurancePaymentSchema);

export default InsurancePaymentModel;
