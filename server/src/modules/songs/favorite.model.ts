import { model, Schema, type HydratedDocument } from "mongoose";

export interface FavoriteRecord {
  userId: string;
  songId: string;
  createdAt: Date;
}

const favoriteSchema = new Schema<FavoriteRecord>(
  {
    userId: { required: true, type: String, index: true },
    songId: { required: true, type: String, index: true },
  },
  { timestamps: true },
);

// Compound index to ensure a user can't favorite the same song twice
favoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });

export type FavoriteDocument = HydratedDocument<FavoriteRecord>;

export const FavoriteModel = model<FavoriteRecord>(
  "Favorite",
  favoriteSchema,
  "Favorites",
);
