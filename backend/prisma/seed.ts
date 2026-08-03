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
  console.log('Seed completed. No mock employees created.');
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
