/**
 * Seed script — creates Leo Club of University of Moratuwa + President account
 * Run with: npx ts-node src/seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User';
import Club from './models/Club';
import MemberProfile from './models/MemberProfile';

const CLUB = {
  name: 'Leo Club of University of Moratuwa',
  clubCode: 'LEOUOM',
  district: 'District 306 B2',
  contactEmail: 'leo.uom@gmail.com',
  contactPhone: '',
  status: 'active' as const,
  description: 'The official Leo Club of University of Moratuwa, affiliated with Lions Clubs International District 306 B2.',
};

const PRESIDENT = {
  email: 'president.leouom@gmail.com',
  password: 'LeoUOM@2026',       // temporary — change after first login
  firstName: 'President',
  lastName: 'Leo UOM',
  position: 'President' as const,
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  console.log('\n🔗 Connecting to MongoDB Atlas…');
  await mongoose.connect(uri);
  console.log('✓ Connected\n');

  // ── 1. Club ──────────────────────────────────────────────────────────────
  let club = await Club.findOne({ clubCode: CLUB.clubCode });
  if (club) {
    console.log(`ℹ Club already exists: ${club.name} (${club._id})`);
  } else {
    club = await Club.create(CLUB);
    console.log(`✓ Club created: ${club.name}`);
    console.log(`  ID : ${club._id}`);
    console.log(`  Code: ${club.clubCode}\n`);
  }

  // ── 2. User ───────────────────────────────────────────────────────────────
  let user = await User.findOne({ email: PRESIDENT.email }).select('+password');
  if (user) {
    console.log(`ℹ User exists — resetting password…`);
    user.password = PRESIDENT.password; // pre-save hook will hash it
    user.club = club._id as any;
    user.role = 'club_exco';
    await user.save();
    console.log('  Password reset and club reference updated.\n');
  } else {
    user = await User.create({
      email: PRESIDENT.email,
      password: PRESIDENT.password, // pre-save hook hashes it — do NOT pre-hash
      role: 'club_exco',
      club: club._id,
      isActive: true,
    });
    console.log(`✓ User created: ${user.email}`);
    console.log(`  Role: club_exco\n`);
  }

  // ── 3. Member Profile ─────────────────────────────────────────────────────
  let profile = await MemberProfile.findOne({ user: user._id });
  if (profile) {
    console.log(`ℹ Member profile already exists for this user.`);
  } else {
    profile = await MemberProfile.create({
      user: user._id,
      club: club._id,
      firstName: PRESIDENT.firstName,
      lastName: PRESIDENT.lastName,
      position: PRESIDENT.position,
      joinDate: new Date(),
      isActive: true,
    });
    // Link profile back to user
    await User.findByIdAndUpdate(user._id, { memberProfile: profile._id });
    console.log(`✓ Member profile created`);
    console.log(`  Name    : ${profile.firstName} ${profile.lastName}`);
    console.log(`  Position: ${profile.position}\n`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('─'.repeat(50));
  console.log('CREDENTIALS TO USE IN THE APP');
  console.log('─'.repeat(50));
  console.log(`Club    : ${CLUB.name}`);
  console.log(`Email   : ${PRESIDENT.email}`);
  console.log(`Password: ${PRESIDENT.password}`);
  console.log(`Role    : club_exco (President)`);
  console.log('─'.repeat(50));
  console.log('Sign in at: register/index.html  OR  the Leo Moment app\n');

  await mongoose.disconnect();
  console.log('✓ Done.\n');
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
