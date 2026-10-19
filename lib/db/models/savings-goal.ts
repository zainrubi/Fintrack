import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type SavingsCategory =
  | 'EMERGENCY_FUND'
  | 'RETIREMENT'
  | 'HOUSE_DOWNPAYMENT'
  | 'EDUCATION'
  | 'WEDDING'
  | 'TRAVEL_VACATION'
  | 'HAJJ_UMRAH'
  | 'GENERAL_SAVINGS'
  | 'OTHER';

export interface ISavingsGoal extends Document {
  userId: string;
  name: string;
  category: SavingsCategory;
  targetAmount?: Types.Decimal128 | null;
  targetDate?: Date | null;
  isEmergencyFund: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required.'],
      maxlength: 120,
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
    targetAmount: {
      type: Schema.Types.Decimal128,
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    isEmergencyFund: {
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
    collection: 'savings_goals',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

SavingsGoalSchema.index({ userId: 1 });

export const SavingsGoalModel: Model<ISavingsGoal> =
  mongoose.models.SavingsGoal ||
  mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);

export default SavingsGoalModel;
