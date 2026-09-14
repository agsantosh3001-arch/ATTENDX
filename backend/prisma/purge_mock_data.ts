import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function purgeMockData() {
  console.log('🚀 Starting Database cleanup of mock/dummy employee accounts...');

  const allowedEmails = [
    'vivaninteriors@gmail.com',
    'vikashreal2@gmail.com',
    'admin@attendx.com',
  ];

  // 1. Delete all users whose email is NOT in allowedEmails
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: allowedEmails,
      },
    },
  });
  console.log(`✅ Deleted ${deletedUsers.count} dummy user accounts (cascade deleted their sessions, devices, and attendance).`);

  // 2. Ensure Vivan Agarwal has clean name and details
  await prisma.user.upsert({
    where: { email: 'vivaninteriors@gmail.com' },
    update: {
      fullName: 'Vivan Agarwal',
      role: 'employee',
      status: 'approved',
      department: 'Engineering',
      designation: 'Senior Lead Architect',
    },
    create: {
      email: 'vivaninteriors@gmail.com',
      googleId: 'google_vivan_real',
      fullName: 'Vivan Agarwal',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vivan',
      role: 'employee',
      status: 'approved',
      department: 'Engineering',
      designation: 'Senior Lead Architect',
      age: 28,
      phoneNumber: '+91 9876543210',
    },
  });
  console.log('✅ Updated Vivan Agarwal (vivaninteriors@gmail.com)');

  // 3. Ensure Aman Rajak is properly approved
  await prisma.user.upsert({
    where: { email: 'vikashreal2@gmail.com' },
    update: {
      fullName: 'Aman Rajak',
      role: 'employee',
      status: 'approved',
      department: 'Operations',
      designation: 'Senior Specialist',
    },
    create: {
      email: 'vikashreal2@gmail.com',
      googleId: 'google_aman_real',
      fullName: 'Aman Rajak',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aman',
      role: 'employee',
      status: 'approved',
      department: 'Operations',
      designation: 'Senior Specialist',
      age: 25,
      phoneNumber: '+91 9876543211',
    },
  });
  console.log('✅ Updated Aman Rajak (vikashreal2@gmail.com)');

  // 4. Query current users in the database
  const currentUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      department: true,
      designation: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n📊 Remaining Real Users in AttendX Database:');
  console.table(currentUsers);

  await prisma.$disconnect();
}

purgeMockData().catch((err) => {
  console.error('❌ Error purging mock data:', err);
  process.exit(1);
});
