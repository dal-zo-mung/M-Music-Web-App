import { model, Schema, type HydratedDocument } from 'mongoose';

export interface SongPersistenceRecord {
  'About Song'?: string;
  'Direct to YT'?: string;
  'Released Date'?: string;
  'Song Title': string;
  Artist: string;
  Lyric: string[];
  albumCover?: string;
  status?: 'published' | 'removed';
  /** Category slug, e.g. "myanmar-worship", "english-hymns" */
  category?: string;
}

const songSchema = new Schema<SongPersistenceRecord>(
  {
    'About Song': String,
    'Direct to YT': String,
    'Released Date': String,
    'Song Title': { required: true, type: String },
    Artist: { required: true, type: String },
    Lyric: { default: [], type: [String] },
    albumCover: { default: 'images/default.jpg', type: String },
    status: { default: 'published', enum: ['published', 'removed'], type: String },
    category: { type: String, index: true }
  },
  {
    collection: 'Songs'
  }
);

export type SongDocument = HydratedDocument<SongPersistenceRecord>;

export const SongModel = model<SongPersistenceRecord>('songform', songSchema, 'Songs');
