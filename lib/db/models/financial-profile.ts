import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IFinancialProfile extends Document {
  userId: string;
  defaultCurrency: string;
  monthlyIncomeTarget?: Types.Decimal128 | null;
  monthlySavingsTarget?: Types.Decimal128 | null;
  emergencyFundTargetMonths: number;
  fiscalYearStartMonth: number;
  createdAt: Date;
  updatedAt: Date;
}

export const FinancialProfileSchema = new Schema<IFinancialProfile>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      unique: true,
      index: true,
    },
    defaultCurrency: {
      type: String,
      required: true,
      default: 'PKR',
      maxlength: 3,
      uppercase: true,
      trim: true,
    },
    monthlyIncomeTarget: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    monthlySavingsTarget: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    emergencyFundTargetMonths: {
      type: Number,
      default: 6,
      min: 1,
      max: 60,
    },
    fiscalYearStartMonth: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
    collection: 'financial_profiles',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

export const FinancialProfileModel: Model<IFinancialProfile> =
  mongoose.models.FinancialProfile ||
  mongoose.model<IFinancialProfile>('FinancialProfile', FinancialProfileSchema);

export default FinancialProfileModel;
