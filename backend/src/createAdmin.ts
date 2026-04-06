/**
 * One-time script — creates the system admin account.
 * Run with: npx ts-node src/createAdmin.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User';

const ADMIN = {
  email: 'admin@myleo.app',
  password: 'Admin@MyLeo2026',
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    existing.password = ADMIN.password;
    existing.role = 'system_admin';
    existing.isActive = true;
    await existing.save();
    console.log('Admin already existed — password reset.\n');
  } else {
    await User.create({ email: ADMIN.email, password: ADMIN.password, role: 'system_admin', isActive: true });
    console.log('Admin account created.\n');
  }

  console.log('─────────────────────────────');
  console.log('Email   :', ADMIN.email);
  console.log('Password:', ADMIN.password);
  console.log('Role    : system_admin');
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); mongoose.disconnect(); process.exit(1); });
