import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the root
dotenv.config({ path: path.join(__dirname, '../.env') });

const usernameOrEmail = process.argv[2];

if (!usernameOrEmail) {
  console.error('❌ Error: Please provide a username or email.');
  console.error('Usage: npm run make-admin <username-or-email>');
  process.exit(1);
}

const MONGO_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/LyricContainer';

async function makeAdmin() {
  try {
    console.log(`Connecting to database...`);
    await mongoose.connect(MONGO_URL);
    console.log(`Connected to MongoDB.`);

    // Access the collection directly to avoid model validation side effects.
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) {
      console.error(`❌ User not found with username or email: "${usernameOrEmail}"`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`✅ User "${usernameOrEmail}" is already an admin.`);
      process.exit(0);
    }

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: 'admin' } }
    );

    console.log(`🎉 SUCCESS! User "${usernameOrEmail}" has been promoted to admin.`);
    console.log(`You can now refresh the app and access the Admin Dashboard.`);
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
