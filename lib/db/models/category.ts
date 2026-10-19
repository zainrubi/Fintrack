import mongoose, { Document, Model, Schema } from 'mongoose';
import type { ExpenseType } from './expense';

export type CategoryType = 'EXPENSE' | 'SAVINGS' | 'INVESTMENT' | 'INSURANCE';

export interface ICategory extends Document {
  userId?: string | null;
  name: string;
  slug: string;
  type: CategoryType;
  defaultExpenseType?: ExpenseType | null;
  icon?: string | null;
  color?: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required.'],
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['EXPENSE', 'SAVINGS', 'INVESTMENT', 'INSURANCE'],
      default: 'EXPENSE',
      required: true,
    },
    defaultExpenseType: {
      type: String,
      enum: ['FIXED', 'VARIABLE'],
      default: null,
    },
    icon: {
      type: String,
      maxlength: 50,
      default: null,
    },
    color: {
      type: String,
      maxlength: 20,
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'categories',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Multi-tenant category query and uniqueness indexes
CategorySchema.index({ userId: 1, type: 1 });
CategorySchema.index({ userId: 1, slug: 1, type: 1 }, { unique: true });

export const CategoryModel: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default CategoryModel;
