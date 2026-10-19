import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { decimal128Getter, decimal128Setter } from '../decimal';

export type ExpenseType = 'FIXED' | 'VARIABLE';
export type PaymentFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'ANNUALLY'
  | 'ONE_TIME';

export interface IExpense extends Document {
  userId: string;
  categoryId: string;
  amount: Types.Decimal128;
  currency: string;
  expenseType: ExpenseType;
  date: Date;
  periodYear: number;
  periodMonth: number;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: PaymentFrequency | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    categoryId: {
      type: String,
      required: [true, 'categoryId is required.'],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Expense amount is required.'],
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
    expenseType: {
      type: String,
      enum: ['FIXED', 'VARIABLE'],
      required: [true, 'expenseType is required.'],
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
    description: {
      type: String,
      required: [true, 'description is required.'],
      maxlength: 255,
      trim: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: [
        'DAILY',
        'WEEKLY',
        'BIWEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'SEMI_ANNUALLY',
        'ANNUALLY',
        'ONE_TIME',
      ],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'expenses',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// Multi-tenant indexes for analytics and reporting
ExpenseSchema.index({ userId: 1, periodYear: 1, periodMonth: 1 });
ExpenseSchema.index({ userId: 1, expenseType: 1 });
ExpenseSchema.index({ userId: 1, categoryId: 1 });
ExpenseSchema.index({ userId: 1, date: -1 });

export const ExpenseModel: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default ExpenseModel;
