import { model, Schema, type HydratedDocument } from 'mongoose';

export interface LyricSlideBlock {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'blank';
  label: string;
  lines: string[];
}

export interface LyricsJson {
  slides: LyricSlideBlock[];
}

export interface DesktopSongPersistenceRecord {
  title: string;
  artist?: string;
  language: string;
  category: string;
  lyrics_json: LyricsJson;
  thumbnail_color?: string;
  is_published: boolean;
  download_count: number;
}

const lyricSlideSchema = new Schema<LyricSlideBlock>(
  {
    id: { required: true, type: String },
    type: { enum: ['verse', 'chorus', 'bridge', 'blank'], required: true, type: String },
    label: { default: '', type: String },
    lines: { default: [], type: [String] }
  },
  { _id: false }
);

const lyricsJsonSchema = new Schema<LyricsJson>(
  {
    slides: { default: [], type: [lyricSlideSchema] }
  },
  { _id: false }
);

const desktopSongSchema = new Schema<DesktopSongPersistenceRecord>(
  {
    title: { required: true, trim: true, type: String },
    artist: { trim: true, type: String },
    language: { default: 'my', trim: true, type: String },
    category: { default: 'worship', trim: true, type: String },
    lyrics_json: { required: true, type: lyricsJsonSchema },
    thumbnail_color: { type: String },
    is_published: { default: false, type: Boolean },
    download_count: { default: 0, min: 0, type: Number }
  },
  {
    collection: 'desktop_songs',
    timestamps: true
  }
);

desktopSongSchema.index({ title: 'text', artist: 'text' });
desktopSongSchema.index({ language: 1 });
desktopSongSchema.index({ category: 1 });
desktopSongSchema.index({ is_published: 1 });

export type DesktopSongDocument = HydratedDocument<DesktopSongPersistenceRecord>;

export const DesktopSongModel = model<DesktopSongPersistenceRecord>(
  'DesktopSong',
  desktopSongSchema,
  'desktop_songs'
);
