import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';

export type LoanFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface ILoan extends Document {
  userId: string;
  loanTitle: string;
  lenderName: string;
  principalAmount: Types.Decimal128;
  outstandingAmount: Types.Decimal128;
  interestRate: Types.Decimal128;
  installmentAmount: Types.Decimal128;
  frequency: LoanFrequency;
  startDate: Date;
  endDate?: Date | null;
  isClosed: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const LoanSchema = new Schema<ILoan>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    loanTitle: {
      type: String,
      required: [true, 'loanTitle is required.'],
      maxlength: 150,
      trim: true,
    },
    lenderName: {
      type: String,
      required: [true, 'lenderName is required.'],
      maxlength: 150,
      trim: true,
    },
    principalAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'principalAmount is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    outstandingAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'outstandingAmount is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    interestRate: {
      type: Schema.Types.Decimal128,
      required: [true, 'interestRate is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    installmentAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'installmentAmount is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    frequency: {
      type: String,
      enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'],
      default: 'MONTHLY',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'startDate is required.'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'loans',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

LoanSchema.index({ userId: 1 });

export const LoanModel: Model<ILoan> =
  mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default LoanModel;
