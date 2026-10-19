import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';

export interface ILoanRepayment extends Document {
  userId: string;
  loanId: string;
  amount: Types.Decimal128;
  principalComponent?: Types.Decimal128 | null;
  interestComponent?: Types.Decimal128 | null;
  paymentDate: Date;
  periodYear: number;
  periodMonth: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const LoanRepaymentSchema = new Schema<ILoanRepayment>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    loanId: {
      type: String,
      required: [true, 'loanId is required.'],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Repayment amount is required.'],
      get: decimal128Getter,
      set: decimal128Setter,
    },
    principalComponent: {
      type: Schema.Types.Decimal128,
      default: null,
      get: decimal128Getter,
      set: decimal128Setter,
    },
    interestComponent: {
      type: Schema.Types.Decimal128,
      default: null,
      get: decimal128Getter,
      set: decimal128Setter,
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
    collection: 'loan_repayments',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

LoanRepaymentSchema.index({ userId: 1, periodYear: 1, periodMonth: 1 });
LoanRepaymentSchema.index({ userId: 1, paymentDate: -1 });
LoanRepaymentSchema.index({ userId: 1, loanId: 1 });

export const LoanRepaymentModel: Model<ILoanRepayment> =
  mongoose.models.LoanRepayment ||
  mongoose.model<ILoanRepayment>('LoanRepayment', LoanRepaymentSchema);

export default LoanRepaymentModel;
