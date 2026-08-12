/**
 * One-time migration: seed `category` field on existing Songs documents.
 *
 * Strategy: keyword matching against Song Title + About Song.
 * Rules are checked in order — first match wins.
 *
 * Run:
 *   npx tsx scripts/seed-categories.ts
 *
 * Requires: MONGO_URI env var (copy from your .env)
 * Safe to re-run — already-categorized songs are skipped.
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Add it to your .env file.');
  process.exit(1);
}

// ─── Category Rules (first match wins) ────────────────────────────────────────
//
// Each rule has:
//   slug     — the value written to the `category` field in MongoDB
//   keywords — at least one must appear (case-insensitive) in title OR "About Song"

const CATEGORY_RULES = [
  { slug: 'myanmar-worship', keywords: ['myanmar worship', 'burmese worship', 'myanmar praise', 'burmese praise'] },
  { slug: 'english-worship', keywords: ['english worship', 'worship', 'praise', 'contemporary christian'] },
  { slug: 'myanmar-gospel',  keywords: ['myanmar gospel', 'burmese gospel'] },
  { slug: 'english-gospel',  keywords: ['english gospel', 'gospel'] },
  { slug: 'myanmar-hymns',   keywords: ['myanmar hymn', 'burmese hymn'] },
  { slug: 'english-hymns',   keywords: ['hymn', 'traditional', 'classic christian'] },
];

// ─── Mongoose schema (minimal) ────────────────────────────────────────────────

const songSchema = new mongoose.Schema(
  {
    'Song Title': String,
    'About Song': String,
    category: String,
    status: String,
  },
  { collection: 'Songs', strict: false }
);

const SongModel = mongoose.model('SeedSong', songSchema, 'Songs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchCategory(title, about) {
  const haystack = `${title} ${about}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        return rule.slug;
      }
    }
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const songs = await SongModel.find({
    $or: [{ category: { $exists: false } }, { category: null }, { category: '' }]
  }).lean().exec();

  console.log(`Found ${songs.length} songs without a category.\n`);

  let updated = 0;
  let unmatched = 0;

  for (const song of songs) {
    const title = String(song['Song Title'] ?? '');
    const about = String(song['About Song'] ?? '');
    const slug = matchCategory(title, about);

    if (!slug) {
      console.log(`  NO MATCH: "${title}"`);
      unmatched++;
      continue;
    }

    await SongModel.updateOne({ _id: song._id }, { $set: { category: slug } }).exec();
    console.log(`  DONE: "${title}" -> ${slug}`);
    updated++;
  }

  console.log(`
-----------------------------------------
  Done!
  Updated  : ${updated}
  Unmatched: ${unmatched} (set manually via Admin Dashboard)
-----------------------------------------`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
