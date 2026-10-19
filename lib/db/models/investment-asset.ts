import mongoose, { Document, Model, Schema } from 'mongoose';

export type InvestmentType =
  | 'MUTUAL_FUND'
  | 'STOCKS'
  | 'REAL_ESTATE'
  | 'GOLD_PRECIOUS_METALS'
  | 'GOVERNMENT_BONDS'
  | 'PROVIDENT_FUND'
  | 'CRYPTO'
  | 'BUSINESS_VENTURE'
  | 'OTHER';

export interface IInvestmentAsset extends Document {
  userId: string;
  assetName: string;
  investmentType: InvestmentType;
  institutionOrPlatform?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const InvestmentAssetSchema = new Schema<IInvestmentAsset>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required.'],
      index: true,
    },
    assetName: {
      type: String,
      required: [true, 'Asset name is required.'],
      maxlength: 150,
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
    institutionOrPlatform: {
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
    collection: 'investment_assets',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InvestmentAssetSchema.index({ userId: 1 });

export const InvestmentAssetModel: Model<IInvestmentAsset> =
  mongoose.models.InvestmentAsset ||
  mongoose.model<IInvestmentAsset>('InvestmentAsset', InvestmentAssetSchema);

export default InvestmentAssetModel;
