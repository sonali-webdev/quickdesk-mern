import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';

async function seed() {
  await mongoose.connect(env.mongoUri);

  const email = 'agent@quickdesk.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Agent already exists');
  } else {
    await User.create({
      name: 'Support Agent',
      email,
      password: 'Agent@12345', // dev only: change it, and never reuse a real password
      role: 'agent',
    });
    console.log(`Agent created: ${email}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});