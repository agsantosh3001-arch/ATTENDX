/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedData() {
  console.log('Starting seed process...');

  // 1. Office Settings (Emami City Nagerbazar Kolkata & 1000m radius)
  const officeSettings = await prisma.officeSettings.findFirst();
  if (!officeSettings) {
    await prisma.officeSettings.create({
      data: {
        officeLatitude: 22.6178,
        officeLongitude: 88.4206,
        allowedRadiusMeters: 2000,
        gpsAccuracyThresholdMeters: 500,
        officeStartTime: '09:00',
        officeEndTime: '18:00',
        timezone: 'Asia/Kolkata',
      },
    });
    console.log('Created default OfficeSettings for Emami City Nagerbazar Kolkata.');
  } else {
    await prisma.officeSettings.update({
      where: { id: officeSettings.id },
      data: {
        officeLatitude: 22.6178,
        officeLongitude: 88.4206,
        allowedRadiusMeters: 2000,
        gpsAccuracyThresholdMeters: 500,
      },
    });
    console.log('Updated existing OfficeSettings to Emami City Nagerbazar Kolkata (1000m radius).');
  }

  // 2. Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@attendx.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'approved',
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: 'admin@attendx.com',
      fullName: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'approved',
      department: 'Management',
      designation: 'Administrator',
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log(`Admin user created/updated: ${admin.email}`);

  // 3. Approved Employee: VIVAN
  const vivan = await prisma.user.upsert({
    where: { email: 'vivaninteriors@gmail.com' },
    update: {
      role: 'employee',
      status: 'approved',
      department: 'Engineering',
      designation: 'Senior Lead Architect',
    },
    create: {
      email: 'vivaninteriors@gmail.com',
      googleId: 'google_mock_vivan',
      fullName: 'VIVAN',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VIVAN',
      role: 'employee',
      status: 'approved',
      department: 'Engineering',
      designation: 'Senior Lead Architect',
      age: 28,
      phoneNumber: '+91 9876543210',
    },
  });
  console.log(`Approved employee created/updated: ${vivan.email}`);

  // 4. Approved Employee: Alex Rivera
  const alex = await prisma.user.upsert({
    where: { email: 'alex.rivera@attendx.com' },
    update: {
      role: 'employee',
      status: 'approved',
      department: 'Product & Design',
      designation: 'Senior Product Manager',
    },
    create: {
      email: 'alex.rivera@attendx.com',
      googleId: 'google_mock_alex',
      fullName: 'Alex Rivera',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      role: 'employee',
      status: 'approved',
      department: 'Product & Design',
      designation: 'Senior Product Manager',
      age: 30,
      phoneNumber: '+91 9876543211',
    },
  });
  console.log(`Approved employee created/updated: ${alex.email}`);

  // 5. Pending Employee: Sarah Connor
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.connor@attendx.com' },
    update: {
      role: 'employee',
      status: 'pending',
      department: 'Operations',
      designation: 'Operations Specialist',
    },
    create: {
      email: 'sarah.connor@attendx.com',
      googleId: 'google_mock_sarah',
      fullName: 'Sarah Connor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'employee',
      status: 'pending',
      department: 'Operations',
      designation: 'Operations Specialist',
      age: 26,
      phoneNumber: '+91 9876543212',
    },
  });
  console.log(`Pending employee created/updated: ${sarah.email}`);

  console.log(`Pending employee created/updated: ${sarah.email}`);

  // Clean out sample/synthetic attendance records so only actual live and preceding entries remain
  const deleted = await prisma.attendance.deleteMany({});
  console.log(`Cleared ${deleted.count} sample/mock attendance records from database.`);
  console.log('Seed completed successfully with live/clean data state.');
}

async function startAndSeed() {
  if (process.env.USE_EMBEDDED_POSTGRES === 'true') {
    try {
      const EmbeddedPostgres = require('embedded-postgres');
      const embeddedPg = new EmbeddedPostgres({
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        persistent: true,
      });
      await embeddedPg.initialise();
      await embeddedPg.start();
      await embeddedPg.createDatabase('attendx');
      console.log('Embedded PostgreSQL server started.');
    } catch (e: any) {
      console.warn('Embedded Postgres warning:', e?.message || e);
    }
  }

  try {
    await seedData();
  } catch (e) {
    console.error('Seeding error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

startAndSeed();

