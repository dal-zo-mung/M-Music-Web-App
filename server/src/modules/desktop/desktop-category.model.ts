import { model, Schema, type HydratedDocument } from 'mongoose';

export interface DesktopCategoryPersistenceRecord {
  name: string;
  language?: string;
}

const desktopCategorySchema = new Schema<DesktopCategoryPersistenceRecord>(
  {
    name: { required: true, trim: true, type: String },
    language: { trim: true, type: String }
  },
  {
    collection: 'desktop_categories',
    timestamps: true
  }
);

desktopCategorySchema.index({ name: 1, language: 1 }, { unique: true });

export type DesktopCategoryDocument = HydratedDocument<DesktopCategoryPersistenceRecord>;

export const DesktopCategoryModel = model<DesktopCategoryPersistenceRecord>(
  'DesktopCategory',
  desktopCategorySchema,
  'desktop_categories'
);
