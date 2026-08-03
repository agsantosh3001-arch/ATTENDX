import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log('🧹 Cleaning pre-added mock employee data...');

  // Delete attendance records associated with mock employees ending with @attendx.com
  const deletedAttendance = await prisma.attendance.deleteMany({
    where: {
      employee: {
        email: {
          endsWith: '@attendx.com',
          not: 'admin@attendx.com',
        },
      },
    },
  });
  console.log(`Deleted ${deletedAttendance.count} mock attendance records.`);

  // Delete mock employees ending with @attendx.com (excluding admin@attendx.com)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@attendx.com',
        not: 'admin@attendx.com',
      },
    },
  });
  console.log(`Deleted ${deletedUsers.count} mock employee accounts.`);

  // Also update seed.ts so it doesn't re-seed mock employees in future
  console.log('Current remaining users in database:');
  const remaining = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, status: true },
  });
  console.table(remaining);

  await prisma.$disconnect();
}

cleanMockData().catch((err) => {
  console.error('Error cleaning mock data:', err);
  process.exit(1);
});
