import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type SalaryType =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'BONUS'
  | 'ALLOWANCE'
  | 'FREELANCE'
  | 'OVERTIME'
  | 'OTHER';

export interface ISalaryRecord extends Document {
  userId: string;
  amount: Types.Decimal128;
  currency: string;
  salaryType: SalaryType;
  payPeriodYear: number;
  payPeriodMonth: number;
  paymentDate: Date;
  employerOrSource?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const SalaryRecordSchema = new Schema<ISalaryRecord>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Salary amount is required.'],
    },
    currency: {
      type: String,
      required: true,
      default: 'PKR',
      maxlength: 3,
      uppercase: true,
      trim: true,
    },
    salaryType: {
      type: String,
      enum: ['PRIMARY', 'SECONDARY', 'BONUS', 'ALLOWANCE', 'FREELANCE', 'OVERTIME', 'OTHER'],
      default: 'PRIMARY',
      required: true,
    },
    payPeriodYear: {
      type: Number,
      required: [true, 'payPeriodYear is required.'],
      min: 1900,
      max: 2100,
    },
    payPeriodMonth: {
      type: Number,
      required: [true, 'payPeriodMonth is required.'],
      min: 1,
      max: 12,
    },
    paymentDate: {
      type: Date,
      required: [true, 'paymentDate is required.'],
    },
    employerOrSource: {
      type: String,
      maxlength: 150,
      trim: true,
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
    collection: 'salary_records',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// Multi-tenant query indexes for salary records
SalaryRecordSchema.index({ userId: 1, payPeriodYear: 1, payPeriodMonth: 1 });
SalaryRecordSchema.index({ userId: 1, paymentDate: -1 });

export const SalaryRecordModel: Model<ISalaryRecord> =
  mongoose.models.SalaryRecord ||
  mongoose.model<ISalaryRecord>('SalaryRecord', SalaryRecordSchema);

export default SalaryRecordModel;
